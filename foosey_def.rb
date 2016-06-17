# Lower-level foosey functions

# database wrapper function that makes it so we don't have to copy code later
# also makes sure the block is performed in a transaction for thread safety
# note that you must use the return keyword at the end of these blocks because
# the transaction block returns its own values
def database
  db = SQLite3::Database.new 'foosey.db'

  yield db
rescue SQLite3::Exception => e
  puts e
  puts e.backtrace
ensure
  db.close if db
end

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
def game_to_s(game_id, date = false, league_id = 1)
  database do |db|
    game = create_query_hash(db.execute2('SELECT
                                            p.DisplayName, g.Score, g.Timestamp
                                          FROM Game g
                                          JOIN Player p
                                          USING (PlayerID)
                                          WHERE g.GameID = :game_id
                                          AND g.LeagueID = :league_id
                                          AND p.LeagueID = :league_id
                                          ORDER BY g.Score DESC',
                                         game_id, league_id))

    s = if date
          Time.at(game.first['Timestamp']).strftime '%b %d, %Y - '
        else
          ''
        end

    game.each do |player|
      s << "#{player['DisplayName']} #{player['Score']} "
    end

    return s.strip
  end
end

def message_slack(text, attach, url)
  data = {
    username: 'Foosey',
    channel: '#foosey',
    text: text,
    attachments: attach,
    icon_emoji: ':foosey:'
  }

  uri = URI.parse(url)

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.ssl_version = :TLSv1
  http.verify_mode = OpenSSL::SSL::VERIFY_PEER

  req = Net::HTTP::Post.new(uri.request_uri)
  req.body = data.to_json
  req['Content-Type'] = 'application/json'

  http.request(req)
end

# true if a game with the given id exists, false otherwise
def valid_game?(game_id, league_id = 1)
  database do |db|
    game = db.get_first_value 'SELECT GameID FROM Game
                               WHERE GameID = :game_id
                               AND LeagueID = :league_id',
                              game_id, league_id

    return !game.nil?
  end
end

# true if a player with the given id exists, false otherwise
def valid_player?(player_id, league_id = 1)
  database do |db|
    player = db.get_first_value 'SELECT PlayerID FROM Player
                                 WHERE PlayerID = :player_id
                                 AND LeagueID = :league_id',
                                player_id, league_id

    return !player.nil?
  end
end

# pull and load
# hot hot hot deploys
def update
  app_dir = app_dir
  # there's probably a git gem we could use here
  system "cd #{app_dir} && git pull" unless app_dir.nil?
  system "cd #{File.dirname(__FILE__)} && git pull"
end

def admin?(slack_name, league_id = 1)
  database do |db|
    admin = db.get_first_value 'SELECT Admin from Player
                                WHERE SlackName = :slack_name
                                AND LeagueID = :league_id
                                COLLATE NOCASE',
                               slack_name, league_id
    return admin == 1
  end
end

def app_dir
  database do |db|
    # return dir
    return db.get_first_value 'SELECT Value FROM Config
                               WHERE Setting = "AppDirectory"'
  end
end

# returns array of players and their badges in a given league
def badges(league_id = 1)
  # get players
  players = player_ids league_id
  badges = Hash.new { |h, k| h[k] = [] }

  # fire badge
  # best daily change
  fire_id = players.max_by { |p| daily_elo_change(p, league_id) }
  fire_id = nil if daily_elo_change(fire_id) == 0
  badges[fire_id] << '🔥'

  # poop badge
  # worst daily change
  poop_id = players.min_by { |p| daily_elo_change(p, league_id) }
  poop_id = nil if daily_elo_change(poop_id) == 0
  badges[poop_id] << '💩'

  # baby badge
  # 10-15 games played
  babies = players.select do |p|
    games_with_player(p, league_id).length.between?(10, 15)
  end
  babies.each { |b| badges[b] << '👶' }

  # monkey badge
  # won last game but elo went down
  monkeys = players.select do |p|
    games = games_with_player(p, league_id)
    next if games.empty?
    last_game = api_game(games[0], league_id)
    last_game[:teams][0][:delta] < 0 && last_game[:teams][0][:players].any? { |a| a[:playerID] == p }
  end
  monkeys.each { |b| badges[b] << '🙈' }

  # toilet badge
  # last skunk (lost w/ 0 points)

  # 5 badge
  # 5-win streak

  # 10 badge
  # 10-win streak

  # build hash
  badges.collect do |k, v|
    {
      playerID: k,
      badges: v
    }
  end
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
def game_ids(league_id = 1)
  database do |db|
    # return id
    return db.execute('SELECT DISTINCT GameID FROM Game
                       WHERE LeagueID = :league_id
                       ORDER BY Timestamp DESC',
                      league_id).flatten
  end
end

# returns an array of game ids involving player with id player_id
def games_with_player(player_id, league_id = 1)
  database do |db|
    return db.execute('SELECT GameID From Game
                       WHERE PlayerID = :player_id
                       AND LeagueID = :league_id
                       ORDER BY Timestamp DESC',
                      player_id, league_id).flatten
  end
end

# returns an array of game ids involving only both player1 and player2
def games(player1_id, player2_id, league_id = 1)
  database do |db|
    return db.execute('SELECT GameID
                       FROM (
                           SELECT GameID FROM Game
                           WHERE PlayerID IN (:player1_id, :player2_id)
                           AND LeagueID = :league_id
                           GROUP BY GameID HAVING COUNT(*) = 2
                       ) AS T1
                       JOIN (
                           SELECT GameID FROM Game
                           AND LeagueID = :league_id
                           GROUP BY GameID
                           HAVING COUNT(*) = 2
                       ) AS T2
                       USING (GameID)',
                      player1_id, player2_id, league_id).flatten
  end
end

# returns the id of a player, given their display name
def id(name, league_id = 1)
  database do |db|
    # return id
    return db.get_first_value 'SELECT PlayerID FROM Player
                               WHERE DisplayName = :name
                               AND LeagueID = :league_id
                               COLLATE NOCASE',
                              name, league_id
  end
end

# returns the elo change over the last 24 hours for the specified player
def daily_elo_change(player_id, league_id = 1)
  database do |db|
    midnight = DateTime.new(Time.now.year, Time.now.month, Time.now.day,
                            0, 0, 0, 0).to_time.to_i
    prev = db.get_first_value('SELECT e.Elo FROM EloHistory e
                               JOIN Game g
                               USING (GameID, PlayerID)
                               WHERE e.PlayerID = :player_id
                               AND e.LeagueID = :league_id
                               AND g.LeagueID = :league_id
                               AND g.Timestamp < :midnight
                               ORDER BY g.Timestamp DESC
                               LIMIT 1',
                              player_id, league_id, midnight)

    today = db.get_first_value('SELECT e.Elo FROM EloHistory e
                                JOIN Game g
                                USING (GameID, PlayerID)
                                WHERE e.PlayerID = :player_id
                                AND e.LeagueID = :league_id
                                AND g.LeagueID = :league_id
                                AND g.Timestamp >= :midnight
                                ORDER BY g.Timestamp DESC
                                LIMIT 1',
                               player_id, league_id, midnight)

    # corner cases
    return 0 unless today
    return today - 1200 unless prev

    return today - prev
  end
end

def extended_stats(player_id, league_id = 1)
  database do |db|
    allies = Hash.new(0) # key -> player_id, value -> wins
    nemeses = Hash.new(0) # key -> player_id, value -> losses
    singles_games = 0
    singles_wins = 0
    doubles_games = 0
    doubles_wins = 0

    db.execute('SELECT DISTINCT GameID
                FROM Game
                WHERE PlayerID = :player_id
                AND LeagueID = :league_id',
               player_id, league_id) do |game_id|
      game = create_query_hash(db.execute2('SELECT PlayerID, Score
                                            FROM Game
                                            WHERE GameID = :game_id
                                            ORDER BY Score', game_id))

      case game.length
      when 2
        singles_games += 1
        if game[1]['PlayerID'] == player_id
          # this player won
          singles_wins += 1
        else
          # this player lost
          nemeses[game[1]['PlayerID']] += 1
        end
      when 4
        doubles_games += 1
        idx = game.index { |g| g['PlayerID'] == player_id }
        if idx >= 2
          # this player won
          doubles_wins += 1
          allies[game[idx == 2 ? 3 : 2]['PlayerID']] += 1
        end
      end
    end

    ally = allies.max_by { |_k, v| v } || ['Nobody', 0]
    nemesis = nemeses.max_by { |_k, v| v } || ['Nobody', 0]
    doubles_win_rate = doubles_wins / doubles_games.to_f
    singles_win_rate = singles_wins / singles_games.to_f
    return {
      ally: name(ally[0]),
      allyCount: ally[1],
      doublesWinRate: doubles_win_rate.nan? ? nil : doubles_win_rate,
      doublesTotal: doubles_games,
      nemesis: name(nemesis[0]),
      nemesisCount: nemesis[1],
      singlesWinRate: singles_win_rate.nan? ? nil : singles_win_rate,
      singlesTotal: singles_games
    }
  end
end

# returns the last elo change player with id player_id has seen over n games
# that is, the delta from their last n played games
def last_elo_change(player_id, n = 1, league_id = 1)
  database do |db|
    elos = db.execute('SELECT e.Elo FROM EloHistory e
                       JOIN Game g
                       USING (GameID, PlayerID)
                       WHERE e.PlayerID = :player_id
                       AND e.LeagueID = :league_id
                       AND g.LeagueID = :league_id
                       ORDER BY g.Timestamp DESC
                       LIMIT :n',
                      player_id, league_id, n + 1).flatten

    # safety if player doesn't have any games
    return 0 if elos.empty?
    # safety if there is only one game, so we should delta from 1200
    return elos.first - 1200 if elos.length == 1

    return elos.first - elos.last
  end
end

def elo(player_id, game_id = nil, league_id = 1)
  database do |db|
    game_id ||= game_ids.last

    elo = db.get_first_value 'SELECT Elo FROM EloHistory
                              WHERE PlayerID = :player_id
                              AND LeagueID = :league_id
                              AND GameID = :game_id',
                             player_id, league_id, game_id

    # 1200 in case they have no games
    return elo || 1200
  end
end

# returns the elo change for player with id player_id from game with id game_id
# if the player was not involved in the game, the delta of their last game
# before game with id game_id will be returned
# if the player doesn't exist or has no games, 0 will be returned
def elo_change(player_id, game_id, league_id = 1)
  database do |db|
    # get game timestamp
    timestamp = db.get_first_value 'SELECT Timestamp FROM Game
                                    WHERE GameID = :game_id
                                    AND LeagueID = :league_id',
                                   game_id, league_id

    elos = db.execute('SELECT e.Elo FROM EloHistory e
                       JOIN Game g
                       USING (GameID, PlayerID)
                       WHERE e.PlayerID = :player_id
                       AND e.LeagueID = :league_id
                       AND g.LeagueID = :league_id
                       AND g.Timestamp <= :timestamp
                       ORDER BY g.Timestamp DESC
                       LIMIT 2',
                      player_id, league_id, timestamp).flatten

    # safety if player doesn't have any games
    return 0 if elos.empty?
    # safety if there is only one game, so we should delta from 1200
    return elos.first - 1200 if elos.length == 1

    return elos.first - elos.last
  end
end

# returns a player's display name, given id
def name(player_id, league_id = 1)
  database do |db|
    return db.get_first_value 'SELECT DisplayName FROM Player
                               WHERE PlayerID = :player_id
                               AND LeagueID = :league_id',
                              player_id, league_id
  end
end

# returns an array of active players
# sorted by PlayerID
# NOTE: index != PlayerID
def names(league_id = 1)
  database do |db|
    return db.execute('SELECT DisplayName FROM Player
                       WHERE ACTIVE = 1
                       AND LeagueID = :league_id',
                      league_id).flatten
  end
end

# returns an array of elo/names
def player_elos(league_id = 1)
  database do |db|
    return db.execute('SELECT DisplayName, Elo from Player
                       WHERE ACTIVE = 1
                       AND LeagueID = :league_id
                       AND GamesPlayed != 0
                       ORDER BY Elo DESC',
                      league_id)
  end
end

# returns true if a player with DisplayName name is in the database
# false otherwise
def player_exists?(name, league_id = 1)
  database do |db|
    player = db.get_first_value 'SELECT * from Player
                                 WHERE DisplayName = :name
                                 AND LeagueID = :league_id
                                 COLLATE NOCASE',
                                name, league_id

    return true if player
  end
end

# returns an array of all player ids
def player_ids(league_id = 1)
  database do |db|
    # return id
    return db.execute('SELECT PlayerID FROM Player
                       WHERE LeagueID = :league_id
                       ORDER BY PlayerID',
                      league_id).flatten
  end
end

# returns the id of the winning player (or players) in game with id id
def winner(game_id, league_id = 1)
  database do |db|
    # get max score
    winner = db.execute('SELECT PlayerID FROM Game
                         WHERE GameID = :game_id
                         AND LeagueID = :league_id
                         AND Score = (
                           SELECT MAX(Score) FROM Game
                           WHERE GameID = :game_id
                           AND LeagueID = :league_id
                           GROUP BY GameID
                         )',
                        game_id, league_id).flatten

    winner = winner.first if winner.length == 1

    # return the winner(s)
    return winner
  end
end

# add a game to the database and update the history tables
# outcome is hash containing key/value pairs where
# key = player id
# value = score
# it's a little wonky but we need to support games of any number of
# players/score combinations, so i think it's best
def add_game(outcome, timestamp = nil, league_id = 1)
  database do |db|
    # get unix time
    timestamp ||= Time.now.to_i
    # get next game id
    game_id = 1 + db.get_first_value('SELECT GameID FROM Game
                                      WHERE LeagueID = :league_id
                                      ORDER BY GameID DESC LIMIT 1',
                                     league_id)

    # insert new game into Game table
    outcome.each do |player_id, score|
      db.execute 'INSERT INTO Game
                  VALUES
                    (:game_id, :player_id, :league_id, :score, :timestamp)',
                 game_id, player_id, league_id, score, timestamp
    end

    # calling recalc with timestamp means we update elo properly for the
    # new game, regardless of the time it was played
    recalc(timestamp)

    players = outcome.keys.collect do |player_id|
      {
        name: name(player_id),
        elo: elo(player_id, game_id),
        delta: elo_change(player_id, game_id)
      }
    end

    slack_url = db.get_first_value 'SELECT Value FROM Config
                                    WHERE Setting = "SlackUrl"'

    unless slack_url.empty?
      text = "Game added: #{game_to_s(game_id)}"
      attachments = [{
        fields: players.collect do |p|
          delta = p[:delta] >= 0 ? "+#{p[:delta]}" : p[:delta]
          {
            title: p[:name],
            value: "#{p[:elo]} (#{delta})",
            short: true
          }
        end
      }]
      puts attachments.to_json
      message_slack(text, attachments, slack_url)
    end

    return {
      gameID: game_id,
      players: players
    }
  end
end

# adds a player to the database
def add_player(name, slack_name = '', admin = false, active = true,
               league_id = 1)
  database do |db|
    return db.execute 'INSERT INTO Player
                       (LeagueID, DisplayName, SlackName, Admin, Active)
                       VALUES
                         (:league_id, :name, :slack_name, :admin, :active)',
                      league_id, name, slack_name, admin ? 1 : 0, active ? 1 : 0
  end
end

# changes properties of game with id game_id
def edit_game(game_id, outcome, timestamp = nil, rec = true, league_id = 1)
  database do |db|
    # get timestamp if we need to keep it unchanged
    timestamp ||= db.get_first_value 'SELECT Timestamp FROM Game
                                      WHERE GameId = :game_id
                                      AND LeagueID = :league_id',
                                     game_id, league_id

    # delete game with id game_id
    db.execute 'DELETE FROM Game
                WHERE GameId = :game_id
                AND LeagueID = :league_id',
               game_id, league_id

    # insert new game into Game table
    outcome.each do |player_id, score|
      db.execute 'INSERT INTO Game
                  VALUES
                    (:game_id, :player_id, :league_id, :score, :timestamp)',
                 game_id, player_id, league_id, score, timestamp
    end
  end

  recalc if rec
end

def edit_player(player_id, display_name = nil, slack_name = nil, admin = nil,
                active = nil, league_id = 1)
  database do |db|
    # update the defined fields
    unless display_name.nil?
      db.execute 'UPDATE Player SET DisplayName = :display_name
                  WHERE PlayerID = :player_id
                  AND LeagueID = :league_id',
                 display_name, player_id, league_id
    end

    unless slack_name.nil?
      db.execute 'UPDATE Player SET SlackName = :slack_name
                  WHERE PlayerID = :player_id
                  AND LeagueID = :league_id',
                 slack_name, player_id, league_id
    end

    unless admin.nil?
      db.execute 'UPDATE Player SET Admin = :admin
                  WHERE PlayerID = :player_id
                  AND LeagueID = :league_id',
                 admin ? 1 : 0, player_id, league_id
    end

    unless active.nil?
      db.execute 'UPDATE Player SET Active = :active
                  WHERE PlayerID = :player_id
                  AND LeagueID = :league_id',
                 active ? 1 : 0, player_id, league_id
    end
  end
end

# recalculate all the stats and populate the history stat tables
# if timestamp is specified, recalcs all games after timestamp
def recalc(timestamp = 0, silent = true)
  unless silent
    start = Time.now.to_f
    puts 'Calculating Elo'
  end
  recalc_elo timestamp
  unless silent
    printf("Took %.3f seconds\n", Time.now.to_f - start)
    start = Time.now.to_f
    puts 'Calculating win rate'
  end
  recalc_win_rate
  printf("Took %.3f seconds\n", Time.now.to_f - start) unless silent
end

def recalc_elo(timestamp = 0, league_id = 1)
  database do |db|
    # init transaction for zoom
    db.transaction

    db.execute 'DELETE FROM EloHistory
                WHERE GameID IN (
                  SELECT GameID FROM Game
                  WHERE Timestamp >= :timestamp
                )
                AND LeagueID = :league_id',
               timestamp, league_id

    win_weight = db.get_first_value 'SELECT Value FROM Config
                                     WHERE Setting = "WinWeight"'
    max_score = db.get_first_value 'SELECT Value FROM Config
                                    WHERE Setting = "MaxScore"'
    k_factor = db.get_first_value 'SELECT Value FROM Config
                                   WHERE Setting = "KFactor"'

    # temporary array of hashes to keep track of player elo
    elos = {}
    player_ids.each do |player_id|
      elos[player_id] = db.get_first_value('SELECT Elo FROM EloHistory e
                                            JOIN Game g USING (GameID, PlayerID)
                                            WHERE PlayerID = :player_id
                                            AND e.LeagueID = :league_id
                                            AND g.LeagueID = :league_id
                                            AND Timestamp <= :timestamp
                                            ORDER BY Timestamp DESC
                                            LIMIT 1',
                                           player_id, league_id, timestamp)

      # in case they had no games before timestamp
      elos[player_id] ||= 1200
    end

    # for each game
    db.execute('SELECT DISTINCT GameID
                FROM Game
                WHERE Timestamp >= :timestamp
                AND LeagueID = :league_id
                ORDER BY Timestamp',
               timestamp, league_id) do |game_id|
      game = create_query_hash(db.execute2('SELECT PlayerID, Score
                                            FROM Game
                                            WHERE GameID = :game_id
                                            ORDER BY Score', game_id))

      # calculate the elo change
      case game.length
      when 2
        rating_a = elos[game[0]['PlayerID']]
        rating_b = elos[game[1]['PlayerID']]
        score_a = game[0]['Score']
        score_b = game[1]['Score']
      when 4
        rating_a = ((elos[game[0]['PlayerID']] +
                     elos[game[1]['PlayerID']]) / 2).round
        rating_b = ((elos[game[2]['PlayerID']] +
                     elos[game[3]['PlayerID']]) / 2).round
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
        case game.length
        when 2
          elos[player['PlayerID']] += idx < 1 ? delta_a : delta_b
        when 4
          elos[player['PlayerID']] += idx < 2 ? delta_a : delta_b
        end
        db.execute 'INSERT INTO EloHistory
                    VALUES (:game_id, :player_id, :league_id, :elo)',
                   game_id, player['PlayerID'], league_id,
                   elos[player['PlayerID']]
      end
    end

    elos.each do |player_id, elo|
      db.execute 'UPDATE Player SET Elo = :elo
                  WHERE PlayerID = :player_id',
                 elo, player_id
    end

    # end transaction
    db.commit
  end
end

def recalc_win_rate(league_id = 1)
  database do |db|
    db.execute('SELECT PlayerID FROM Player WHERE LeagueID = :league_id',
               league_id) do |player_id|
      db.execute('UPDATE Player SET GamesPlayed = (
                    SELECT COUNT(*) FROM Game
                    WHERE PlayerID = :player_id
                    AND LeagueID = :league_id
                  ) WHERE PlayerID = :player_id
                    AND LeagueID = :league_id',
                 player_id, league_id)

      db.execute('UPDATE Player SET GamesWon = (
                    SELECT COUNT(*) FROM Game
                    JOIN (
                      SELECT GameID, MAX(Score) AS Score FROM Game
                      WHERE LeagueID = :league_id
                      GROUP BY GameID
                    )
                    USING (GameID, Score)
                    WHERE PlayerID = :player_id
                    AND LeagueID = :league_id
                  ) WHERE PlayerID = :player_id
                    AND LeagueID = :league_id',
                 league_id, player_id)
    end
  end
end

# remove a game by game_id
def remove_game(game_id, rec = true, league_id = 1)
  database do |db|
    # get timestamp
    timestamp = db.get_first_value 'SELECT Timestamp FROM Game
                                    WHERE GameID = :game_id
                                    AND LeagueID = :league_id',
                                   game_id, league_id

    # remove the game
    db.execute 'DELETE FROM Game
                WHERE GameID = :game_id
                AND LeagueID = :league_id',
               game_id, league_id

    db.execute 'DELETE FROM EloHistory
                WHERE GameID = :game_id
                AND LeagueID = :league_id',
               game_id, league_id

    recalc(timestamp) if rec
  end
end
