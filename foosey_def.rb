# Lower-level foosey functions

# dank helper function that returns an array of hashes from execute2 output
def create_query_hash(array)
  names = array.shift
  rval = []
  array.each do |r|
    row = {}
    names.each_with_index { |column, idx| row[column] = r[idx] }
    rval << row
  end
  rval
end

# takes a game_id and returns a string of the game results useful for slack
# if date = true, it will be prepended with a nicely formatted date
def game_to_s(game_id, date = false)
  db = SQLite3::Database.new 'foosey.db'

  game = create_query_hash(db.execute2('SELECT p.DisplayName, g.Score, g.Timestamp
                                        FROM Game g
                                        JOIN Player p
                                        USING (PlayerID)
                                        WHERE g.GameID = :game_id
                                        ORDER BY g.Score DESC', game_id))

  s = if date
        Time.at(game.first['Timestamp']).strftime '%b %d, %Y - '
      else
        ''
  end

  game.each do |player|
    s << "#{player['DisplayName']} #{player['Score']} "
  end

  s.strip
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

def message_slack(_thisGame, text, attach)
  # TODO: Use Net::HTTP.Post here
  dev = `curl --silent -X POST --data-urlencode 'payload={"channel": "#foosey", "username": "foosey-app", "text": "Game added: #{text}", "icon_emoji": ":foosey:", "attachments": #{attach.to_json}}' #{$slack_url}`
end

# pull and load
# hot hot hot deploys
def update
  app_dir = app_dir
  # there's probably a git gem we could use here
  system "cd #{app_dir} && git pull" unless app_dir.nil?
  system "cd #{File.dirname(__FILE__)} && git pull"
end

def admin?(slack_name)
  db = SQLite3::Database.new 'foosey.db'
  admin = db.get_first_value 'SELECT Admin from Player
                              WHERE SlackName = :slack_name
                              COLLATE NOCASE', slack_name
  admin == 1
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

def app_dir
  db = SQLite3::Database.new 'foosey.db'

  # return dir
  db.get_first_value 'SELECT Value FROM Config
                      WHERE Setting = "AppDirectory"'
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns the respective elo deltas given two ratings and two scores
def elo_delta(rating_a, score_a, rating_b, score_b,
                   k_factor, win_weight, max_score)
  # elo math please never quiz me on this
  expected_a = 1 / (1 + 10**((rating_b - rating_a) / 800.to_f))
  expected_b = 1 / (1 + 10**((rating_a - rating_b) / 800.to_f))

  outcome_a = score_a / (score_a + score_b).to_f
  if outcome_a < 0.5
    # a won
    outcome_a **= win_weight
    outcome_b = 1 - outcome_a
  else
    # b won
    outcome_b = (1 - outcome_a)**win_weight
    outcome_a = 1 - outcome_b
  end

  # divide elo change to be smaller if it wasn't a full game to 10
  ratio = [score_a, score_b].max / max_score.to_f

  # calculate elo change
  delta_a = (k_factor * (outcome_a - expected_a) * ratio).round
  delta_b = (k_factor * (outcome_b - expected_b) * ratio).round
  [delta_a, delta_b]
end

# returns an array of all game ids
def game_ids
  db = SQLite3::Database.new 'foosey.db'

  # return id
  db.execute('SELECT DISTINCT GameID FROM Game
              ORDER BY Timestamp').flatten
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns an array of game ids involving player with id player_id
def games_with_player(player_id)
  db = SQLite3::Database.new 'foosey.db'

  db.execute('SELECT GameID From Game
              WHERE PlayerID = :player_id
              ORDER BY Timestamp', player_id).flatten
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns an array of game ids involving only both player1 and player2
def games(player1_id, player2_id)
  db = SQLite3::Database.new 'foosey.db'

  db.execute('SELECT GameID
              FROM (
                  SELECT GameID FROM Game
                  WHERE PlayerID IN (:player1_id, :player2_id)
                  GROUP BY GameID HAVING COUNT(*) = 2
              ) AS T1
              JOIN (
                  SELECT GameID FROM Game
                  GROUP BY GameID
                  HAVING COUNT(*) = 2
              ) AS T2
              USING (GameID)', player1_id, player2_id).flatten
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns the id of a player, given their display name
def id(name)
  db = SQLite3::Database.new 'foosey.db'

  # return id
  db.get_first_value 'SELECT PlayerID FROM Player
                      WHERE DisplayName = :name
                      COLLATE NOCASE', name
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns the last elo change player with id player_id has seen over n games
# that is, the delta from their last n played games
def last_elo_change(player_id, n = 1)
  db = SQLite3::Database.new 'foosey.db'

  elos = db.execute('SELECT e.Elo FROM EloHistory e
                     JOIN Game g
                     USING (GameID, PlayerID)
                     WHERE e.PlayerID = :player_id
                     ORDER BY g.Timestamp DESC
                     LIMIT :n', player_id, n + 1).flatten

  elos.first - elos.last
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns the elo change for player with id player_id from game with id game_id
# if the player was not involved in the game, the delta of their last game
# before game with id game_id will be returned
# if the player doesn't exist or has no games, 0 will be returned
def elo_change(player_id, game_id)
  db = SQLite3::Database.new 'foosey.db'

  # get game timestamp
  timestamp = db.get_first_value 'SELECT Timestamp FROM Game
                                  WHERE GameID = :game_id', game_id

  elos = db.execute('SELECT e.Elo FROM EloHistory e
                     JOIN Game g
                     USING (GameID, PlayerID)
                     WHERE e.PlayerID = :player_id
                     AND g.Timestamp <= :timestamp
                     ORDER BY g.Timestamp DESC
                     LIMIT 2', player_id, timestamp).flatten

  # safety if player doesn't have any games
  return 0 if elos.empty?
  # safety if there is only one game, so we should delta from 1200
  return elos.first - 1200 if elos.length == 1

  elos.first - elos.last
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns a player's display name, given id
def name(player_id)
  db = SQLite3::Database.new 'foosey.db'
  db.get_first_value 'SELECT DisplayName FROM Player
                      WHERE PlayerID = :player_id', player_id
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns an array of active players
# sorted by PlayerID
# NOTE: index != PlayerID
def names
  db = SQLite3::Database.new 'foosey.db'
  db.execute('SELECT DisplayName FROM Player
              WHERE ACTIVE = 1').flatten
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns an array of elo/names
def player_elos
  db = SQLite3::Database.new 'foosey.db'
  db.execute('SELECT DisplayName, Elo from Player
              WHERE ACTIVE = 1 AND GamesPlayed != 0
              ORDER BY Elo DESC')
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns true if a player with DisplayName name is in the database
# false otherwise
def player_exists?(name)
  db = SQLite3::Database.new 'foosey.db'

  player = db.get_first_value 'SELECT * from Player
                               WHERE DisplayName = :name
                               COLLATE NOCASE', name

  true if player
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns an array of all player ids
def player_ids
  db = SQLite3::Database.new 'foosey.db'

  # return id
  db.execute('SELECT PlayerID FROM Player
              ORDER BY PlayerID').flatten
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns the number of players in a specified game
# pass a line from games.csv to this
def players_in_game(game)
  g_a = game.strip.split(',')[2..-1]
  players = 0
  for g in g_a.each
    players += 1 if g != '-1'
  end
  players
end

# returns an array of win rates
# sorted by PlayerID
# NOTE: index != PlayerID
def win_rates
  db = SQLite3::Database.new 'foosey.db'
  db.execute 'SELECT DisplayName, WinRate from Player
              WHERE ACTIVE = 1 AND GamesPlayed != 0
              ORDER BY WinRate DESC'
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns the id of the winning player (or players) in game with id id
def winner(game_id)
  db = SQLite3::Database.new 'foosey.db'

  # get max score
  winner = db.execute('SELECT PlayerID FROM Game
                       WHERE GameID = :game_id AND Score = (
                         SELECT MAX(Score) FROM Game
                         WHERE GameID = :game_id
                         GROUP BY GameID
                       )', game_id).flatten

  winner = winner.first if winner.length == 1

  # return the winner(s)
  winner
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# add a game to the database and update the history tables
# outcome is hash containing key/value pairs where
# key = player id
# value = score
# it's a little wonky but we need to support games of any number of
# players/score combinations, so i think it's best
def add_game(outcome, timestamp = nil)
  db = SQLite3::Database.new 'foosey.db'

  win_weight = db.get_first_value 'SELECT Value FROM Config
                                   WHERE Setting = "WinWeight"'
  max_score = db.get_first_value 'SELECT Value FROM Config
                                  WHERE Setting = "MaxScore"'
  k_factor = db.get_first_value 'SELECT Value FROM Config
                                 WHERE Setting = "KFactor"'

  # get unix time
  timestamp ||= Time.now.to_i
  # get next game id
  game_id = 1 + db.get_first_value('SELECT GameID FROM Game
                                    ORDER BY GameID DESC LIMIT 1')

  # insert new game into Game table
  outcome.each do |player_id, score|
    db.execute 'INSERT INTO Game
                VALUES (:game_id, :player_id, :score, :timestamp)',
               game_id, player_id, score, timestamp
  end

  # at this point we are done if the game was not 2 or 4 people
  return unless outcome.length == 2 || outcome.length == 4

  # calculate elo change
  # this code is mostly copied from recalc_elo
  # we could have another method, but i'm not really sure what the purpose
  # of that method would be apart from preventing copied code
  # maybe update_elo_by_game(game_id) ?
  game = create_query_hash(db.execute2('SELECT p.PlayerID, g.Score, p.Elo
                                        FROM Game g
                                        JOIN Player p
                                        USING (PlayerID)
                                        WHERE g.GameID = :game_id
                                        ORDER BY g.Score', game_id))

  # calculate the elo change
  if game.length == 2
    rating_a = game[0]['Elo']
    rating_b = game[1]['Elo']
    score_a = game[0]['Score']
    score_b = game[1]['Score']
  elsif game.length == 4
    rating_a = ((game[0]['Elo'] + game[1]['Elo']) / 2).round
    rating_b = ((game[2]['Elo'] + game[3]['Elo']) / 2).round
    score_a = game[0]['Score']
    score_b = game[2]['Score']
  else
    return
  end

  delta_a, delta_b = elo_delta(rating_a, score_a, rating_b, score_b,
                               k_factor, win_weight, max_score)

  # update history and player tables
  game.each_with_index do |player, idx|
    # elohistory
    if game.length == 2
      player['Elo'] += idx < 1 ? delta_a : delta_b
    elsif game.length == 4
      player['Elo'] += idx < 2 ? delta_a : delta_b
    end
    db.execute 'INSERT INTO EloHistory
                VALUES (:game_id, :player_id, :elo)',
               game_id, player['PlayerID'], player['Elo']

    games_played = db.get_first_value 'SELECT COUNT(*) FROM Game
                                       WHERE PlayerID = :player_id',
                                      player['PlayerID']
    wins = db.get_first_value 'SELECT COUNT(*) FROM (
                                 SELECT PlayerID, MAX(Score)
                                 FROM Game
                                 GROUP BY GameID
                               ) WHERE PlayerID = :player_id',
                              player['PlayerID']

    # player
    db.execute 'UPDATE Player
                SET Elo = :elo, GamesPlayed = :games_played,
                WinRate = :win_rate
                WHERE PlayerID = :player_id',
               player['Elo'], games_played, wins / games_played.to_f,
               player['PlayerID']
  end
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# adds a player to the database
def add_player(name, slack_name = '', admin = false, active = true)
  db = SQLite3::Database.new 'foosey.db'

  db.execute 'INSERT INTO Player (DisplayName, SlackName, Admin, Active)
              VALUES (:name, :slack_name, :admin, :active)',
             name, slack_name, admin ? 1 : 0, active ? 1 : 0
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# recalculate all the stats and populate the history stat tables
def recalc
  puts 'Calculating games played'
  recalc_games_played
  puts 'Calculating Elo'
  recalc_elo
  puts 'Calculating win rate'
  recalc_win_rate
end

def recalc_elo
  db = SQLite3::Database.new 'foosey.db'

  db.execute 'UPDATE Player SET Elo = 1200'

  db.execute 'DELETE FROM EloHistory'

  win_weight = db.get_first_value 'SELECT Value FROM Config
                                   WHERE Setting = "WinWeight"'
  max_score = db.get_first_value 'SELECT Value FROM Config
                                  WHERE Setting = "MaxScore"'
  k_factor = db.get_first_value 'SELECT Value FROM Config
                                 WHERE Setting = "KFactor"'

  # temporary array of hashes to keep track of player elo
  player_count = db.get_first_value 'SELECT COUNT(*) FROM Player'
  elos = Array.new(player_count, 1200)

  # for each game
  db.execute 'SELECT DISTINCT GameID FROM Game ORDER BY Timestamp' do |game_id|
    game = create_query_hash(db.execute2('SELECT PlayerID, Score
                                          FROM Game
                                          WHERE GameID = :game_id
                                          ORDER BY Score', game_id))

    # calculate the elo change
    if game.length == 2
      rating_a = elos[game[0]['PlayerID'] - 1]
      rating_b = elos[game[1]['PlayerID'] - 1]
      score_a = game[0]['Score']
      score_b = game[1]['Score']
    elsif game.length == 4
      rating_a = ((elos[game[0]['PlayerID'] - 1] + elos[game[1]['PlayerID'] - 1]) / 2).round
      rating_b = ((elos[game[2]['PlayerID'] - 1] + elos[game[3]['PlayerID'] - 1]) / 2).round
      score_a = game[0]['Score']
      score_b = game[2]['Score']
    else
      # fuck trips
      next
    end

    delta_a, delta_b = elo_delta(rating_a, score_a, rating_b, score_b,
                                 k_factor, win_weight, max_score)

    # insert into history table
    game.each_with_index do |player, idx|
      if game.length == 2
        elos[player['PlayerID'] - 1] += idx < 1 ? delta_a : delta_b
      elsif game.length == 4
        elos[player['PlayerID'] - 1] += idx < 2 ? delta_a : delta_b
      end
      db.execute 'INSERT INTO EloHistory
                  VALUES (:game_id, :player_id, :elo)',
                 game_id, player['PlayerID'], elos[player['PlayerID'] - 1]
    end
  end

  elos.each_with_index do |e, idx|
    db.execute 'UPDATE Player SET Elo = :elo
                WHERE PlayerID = :player_id;',
               e, idx + 1
  end
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

def recalc_games_played
  db = SQLite3::Database.new 'foosey.db'

  db.execute 'SELECT DISTINCT PlayerID FROM Player' do |player_id|
    db.execute 'UPDATE Player SET GamesPlayed = (
                  SELECT COUNT(*) FROM Game
                  WHERE PlayerID = :player_id
                ) WHERE PlayerID = :player_id', player_id
  end
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

def recalc_win_rate
  db = SQLite3::Database.new 'foosey.db'

  db.execute 'DELETE FROM WinRateHistory'

  # temporary array of hashes to keep track of player games/wins
  player_count = db.get_first_value 'SELECT COUNT(*) FROM Player'
  players = Array.new(player_count, {})
  players.map! do |_h|
    { games: 0, wins: 0 }
  end

  db.execute 'SELECT DISTINCT GameID FROM Game ORDER BY Timestamp' do |game_id|
    game = create_query_hash(db.execute2('SELECT PlayerID, Score
                                          FROM Game
                                          WHERE GameID = :game_id
                                          ORDER BY Score', game_id))

    winning_score = game.max_by { |p| p['Score'] }['Score']

    game.each do |player|
      # PlayerID starts 1, so we are subtracting 1 to offset
      players[player['PlayerID'] - 1][:games] += 1
      if player['Score'] == winning_score
        players[player['PlayerID'] - 1][:wins] += 1
      end

      win_rate = players[player['PlayerID'] - 1][:wins] /
                 players[player['PlayerID'] - 1][:games].to_f
      db.execute 'INSERT INTO WinRateHistory
                  VALUES (:game_id, :player_id, :win_rate)',
                 game_id, player['PlayerID'], win_rate
    end
  end

  db.execute 'SELECT DISTINCT PlayerID FROM Player' do |player_id|
    db.execute 'UPDATE Player SET WinRate = (
                  SELECT w.WinRate FROM WinRateHistory w
                  JOIN Game g USING (GameID)
                  WHERE w.PlayerID = :player_id
                  ORDER BY g.Timestamp DESC LIMIT 1
                ) WHERE PlayerID = :player_id;', player_id
  end
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# remove a game by game_id
def remove_game(game_id, recalc = true)
  db = SQLite3::Database.new 'foosey.db'

  # get players from game
  players = db.execute('SELECT PlayerID FROM Game
                        WHERE GameID = :game_id', game_id).flatten

  # remove the game
  db.execute 'DELETE FROM Game
              WHERE GameID = :game_id', game_id

  db.execute 'DELETE FROM EloHistory
              WHERE GameID = :game_id', game_id

  db.execute 'DELETE FROM WinRateHistory
              WHERE GameID = :game_id', game_id

  recalc if recalc
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end
