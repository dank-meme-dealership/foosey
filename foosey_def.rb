# Use this file for methods in foosey that can be reloaded at anytime
# So that we can use the update method in foosey.rb to reload this file
# And have some dank deploys

# function to return a response object for slack
def make_response(response, attachments = [])
  {
    text: response, # send a text response (replies to channel if not blank)
    attachments: attachments,
    link_names: '1',
    username: 'foosey', # overwrite configured username (ex: MyCoolBot)
    icon_url: 'http://i.imgur.com/MyGxqRM.jpg', # overwrite configured icon (ex: https://mydomain.com/some/image.png
  }
end

def message_slack(_thisGame, text, attach)
  # TODO: Use Net::HTTP.Post here
  dev = `curl --silent -X POST --data-urlencode 'payload={"channel": "#foosey", "username": "foosey-app", "text": "Game added: #{text}", "icon_emoji": ":foosey:", "attachments": #{attach.to_json}}' #{$slack_url}`
end

# function to make a help message
def help_message
  %{*Usage:*

    To record a singles game:
    `foosey Matt 10 Conner 1`

    To record a doubles game:
    `foosey Greg 10 Erich 10 Blake 9 Daniel 9`

    To predict the score of a singles game (based on Elo):
    `foosey predict Matt Brik`

    To see the full history between you and another player:
    `foosey history Will Erich`

    To get stats about all players:
    `foosey stats`

    To undo the last game:
    `foosey undo`

    To get this help message:
    `foosey help`}
end

def succinct_help
  help = "I couldn't figure out what you were trying to do, to see what I can do try `foosey help`"
  make_response(help)
end

# add a game to the database and update the history tables
# outcome is hash containing key/value pairs where
# key = player display name (what they'd be added as via slack/app)
# value = score
# it's a little wonky but we need to support games of any number of
# players/score combinations, so i think it's best
def add_game(outcome)
  db = SQLite3::Database.new 'foosey.db'

  win_weight = db.get_first_value 'SELECT Value FROM Config
                                   WHERE Setting = "WinWeight"'
  max_score = db.get_first_value 'SELECT Value FROM Config
                                  WHERE Setting = "MaxScore"'
  k_factor = db.get_first_value 'SELECT Value FROM Config
                                 WHERE Setting = "KFactor"'

  # get unix time
  timestamp = Time.now.to_i
  # get next game id
  game_id = 1 + db.get_first_value('SELECT GameID FROM Game
                                    ORDER BY GameID DESC LIMIT 1')

  # insert new game into Game table
  outcome.each do |name, score|
    player_id = db.get_first_value 'SELECT PlayerID FROM Player
                                    WHERE DisplayName = :name
                                    COLLATE NOCASE', name
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

  delta_a, delta_b = calc_elo_delta(rating_a, score_a, rating_b, score_b,
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

# returns the last elo change player with id player_id has seen over n games
# that is, the delta from their last n played games
def get_last_elo_change(player_id, n = 1)
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

# adds a player to the database
def add_player(name, slack_name = '')
  db = SQLite3::Database.new 'foosey.db'

  db.execute 'INSERT INTO Player (DisplayName, SlackName)
              VALUES (:name, :slack_name)', name, slack_name
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# def add_game(text, content, user_name)
#   # Add last game from slack input
#   now = Time.now.to_i
#   game = text.split(' ') # get the game information
#   i = 0
#   new_game = Array.new($names.length + 2, -1)
#   new_game[0] = now # set first column to timestamp
#   new_game[1] = "@#{user_name}" # set second column to slack username
#   while i < game.length
#     name_column = $names.find_index(game[i]) + 2 # get column of person's name
#     new_game[name_column] = game[i + 1].to_i # to_i should be safe here since we've verified input earlier
#     i += 2
#   end
#   max = new_game[2..-1].max # this is okay because new_game is an int[]

#   lastGame = content.split("\n").pop.split(',')[2..-1].join(',')
#   lastGameUsername = content.split("\n").pop.split(',')[1]
#   thisGame = new_game[2..-1].join(',') # complicated way to join
#   thisGameJoined = new_game.join(',')

#   content += "\n" + thisGameJoined # add this game to the paste content

#   # update game
#   File.write('games.csv', content)

#   # set up attachments
#   attach = []
#   players = players_in_game(thisGameJoined)
#   if players == 2 || players == 4
#     # if 2 players
#     if players == 2
#       # get record
#       record = record(game[0], game[2], content)
#     # if 4 players
#     else
#       # get record
#       team1 = []
#       team2 = []
#       i = 0
#       while i < game.length
#         if game[i + 1].to_i == max
#           team1 << game[i]
#         else
#           team2 << game[i]
#         end
#         i += 2
#       end
#       record = record(team1.join('&').to_s, team2.join('&').to_s, content)
#     end

#     # add them to the attachments
#     attach << get_change(content, new_game[2..-1])
#     attach << record[0]
#   end

#   message_slack(new_game[2..-1], text, attach) if $app

#   if lastGame != thisGame
#     make_response('Game added!', attach)
#   else
#     make_response("Game added!\nThis game has the same score as the last game that was added. If you added this game in error you can undo this action.", attach)
#   end
# end

# def get_change(content, newGame)
#   games = content.split("\n")[1..-1]

#   elos, change = get_elos(games)

#   fields = []
#   newGame.each_index do |i|
#     if newGame[i] != -1
#       person = elos.select { |person| person[:name].downcase == $names[i] }[0]
#       elo = person[:elo]
#       elo_change = change[i].to_i >= 0 ? "+#{change[i]}" : change[i]
#       fields << {
#         title: $names[i].capitalize,
#         value: "#{elo} (#{elo_change})",
#         short: true
#       }
#     end
#   end

#   change = {
#     pretext: "Elos after that game:",
#     fields: fields
#   }

#   change
# end

# function to calculate average scores
# def get_avg_scores(games)
#   total_scores = Array.new($names.length, 0)
#   total_games = Array.new($names.length, 0)
#   games.each do |g| # for each player
#     g_a = g.strip.split(',')[2..-1] # turn the game into an array of scores
#     g_a.each_with_index do |value, idx| # for each player
#       # the +1s in here are to prevent off-by-ones because names starts at 0 and scores start at 2 because of timestamp and
#       total_scores[idx] += value.to_i unless value.to_i == -1 # if they played, increment score
#       total_games[idx] += 1 unless value.to_i == -1 # and total num games
#     end
#   end

#   avg_score = []
#   averages = ''
#   # total_played = ""
#   $names.each_with_index do |n, idx|
#     avg_score << { name: n, avg: total_scores[idx] / (total_games[idx] * 1.0) } unless total_games[idx] == 0 or $ignore.include? n
#     # total_played += "#{$names[i].capitalize}: #{total_games[i]}\n" unless total_games[i] == 0
#   end

#   avg_score = avg_score.sort { |a, b| b[:avg] <=> a[:avg] } # cheeky sort

#   return avg_score if $app

#   avg_score.each do |s|
#     averages += "#{s[:name].capitalize}: #{'%.2f' % s[:avg]}\n"
#   end

#   averages
#   # return make_response("*Here are all of the statistics for your team:*", statistics)
# end

# def calculate_elo_change(g, elo, total_games)
#   change = Array.new($names.length, 0) # empty no change array

#   # quit out unless a 2 or 4 person game
#   return elo, total_games, change if players_in_game(g) != 2 && players_in_game(g) != 4

#   prev = elo.dup

#   k_factor = 50 # we can play around with this, but chess uses 15 in most skill ranges

#   g_a = g.strip.split(',')[2..-1]
#   max = g_a.max {|a,b| a.to_i <=> b.to_i }
#   # variable names from here out are going to be named after those mentioned here:
#   # http://www.chess.com/blog/wizzy232/how-to-calculate-the-elo-system-of-rating

#   # if 2 players
#   if players_in_game(g) == 2
#     # get indexes
#     p_a = g_a.index { |p| p != '-1' }
#     p_b = g_a.rindex { |p| p != '-1' }

#     # then get points
#     p_a_p = g_a[p_a].to_i
#     p_b_p = g_a[p_b].to_i

#     # then get previous elos
#     r_a = elo[p_a]
#     r_b = elo[p_b]

#   # if 4 players
#   else
#     # get indexes of winners
#     t_a_p_a = g_a.index { |p| p == max }
#     t_a_p_b = g_a.rindex { |p| p == max }

#     # get indexes of losers
#     t_b_p_a = g_a.index { |p| p != '-1' && p != max }
#     t_b_p_b = g_a.rindex { |p| p != '-1' && p != max }

#     # then get points
#     p_a_p = g_a[t_a_p_a].to_i
#     p_b_p = g_a[t_b_p_a].to_i

#     # then get team elos
#     r_a = ((elo[t_a_p_a] + elo[t_a_p_b]) / 2).round
#     r_b = ((elo[t_b_p_a] + elo[t_b_p_b]) / 2).round
#   end

#   # do shit
#   e_a = 1 / (1 + 10**((r_b - r_a) / 800.to_f))
#   e_b = 1 / (1 + 10**((r_a - r_b) / 800.to_f))
#   # method 1: winner gets all
#   # s_a = p_a_p > p_b_p ? 1 : 0
#   # s_b = 1 - s_a
#   # method 2: add a weight to winner
#   win_weight = 1.2
#   s_a = p_a_p / (p_a_p + p_b_p).to_f
#   if s_a < 0.5
#     s_a **= win_weight
#     s_b = 1 - s_a
#   else
#     s_b = (1 - s_a)**win_weight
#     s_a = 1 - s_b
#   end

#   # divide elo change to be smaller if it wasn't a full game to 10
#   ratio = 10 / max.to_i

#   r_a_n = (k_factor * (s_a - e_a) / ratio).round
#   r_b_n = (k_factor * (s_b - e_b) / ratio).round

#   # if 2 players
#   if players_in_game(g) == 2
#     # add back to elos
#     elo[p_a] += r_a_n
#     elo[p_b] += r_b_n

#     # add to player total games
#     total_games[p_a] += 1
#     total_games[p_b] += 1

#   # if 4 players
#   else
#     # add winner elos
#     elo[t_a_p_a] += r_a_n
#     elo[t_a_p_b] += r_a_n

#     # subtract loser elos
#     elo[t_b_p_a] += r_b_n
#     elo[t_b_p_b] += r_b_n

#     # add to player total games
#     total_games[t_a_p_a] += 1
#     total_games[t_a_p_b] += 1
#     total_games[t_b_p_a] += 1
#     total_games[t_b_p_b] += 1
#   end

#   change = prev.zip(elo).map { |x, y| y - x }

#   [elo, total_games, change]
# end

# calculates singles elo and returns array hash
# def get_elos(games)
#   now = Time.at(Time.now.to_i).getlocal($UTC)
#   elo = Array.new($names.length, 1200)
#   total_games = Array.new($names.length, 0)
#   all = []
#   change = ''

#   games_c = games.dup
#   g_i = 0
#   for g in games_c.each # adjust players elo game by game

#     elo, total_games, change = calculate_elo_change(g, elo, total_games)

#     gameTime = Time.at(g.split(',')[0].to_i).getlocal($UTC)
#     all.unshift(change) if Time.at(now).to_date === Time.at(gameTime).to_date

#     g_i += 1
#   end

#   elo_ah = []
#   for i in 0...$names.length
#     unless $ignore.include? $names[i]
#       elo_ah << { name: $names[i], elo: elo[i], change: all.map { |a| a[i] }.inject(:+), games: total_games[i] } unless total_games[i] == 0
#     end
#   end
#   sorted = elo_ah.sort { |a, b| b[:elo] <=> a[:elo] } # sort the shit out of it, ruby style
#   [sorted, change]
# end

# # function to display elo
# def get_elo(games)
#   elo_ah = get_elos(games)[0]
#   elo_s = ''
#   for i in 0...elo_ah.length
#     elo_s += "#{elo_ah[i][:name].capitalize}: #{elo_ah[i][:elo]}\n" unless $ignore.include? elo_ah[i][:name]
#   end

#   elo_s
# end

def get_charts(name, games)
  chart_data = []
  elo = Array.new($names.length, 1200)
  total_games = Array.new($names.length, 0)
  real_total_games = 0
  total_wins = 0
  total_score = 0
  index = $names.index(name)
  g_i = 0
  for g in games.each
    date, time = dateTime(g, '%m/%d', '%H:%M')
    elo, total_games, change = calculate_elo_change(g, elo, total_games)
    g_a = g.strip.split(',')[2..-1] # turn the game into an array of scores
    max = g_a.max { |a, b| a.to_i <=> b.to_i }
    total_wins += 1 if g_a[index] == max
    if g_a[index] != '-1'
      total_score += g_a[index].to_i
      real_total_games += 1
      avg = total_score.to_f / real_total_games.to_f
      percent = total_wins == 0 ? 0 : total_wins.to_f * 100 / real_total_games.to_f
      entry = {
        date: date,
        id: g_i,
        elo: elo[index],
        avg: avg,
        percent: percent
      }
      chart_data << entry
    end
    g_i += 1
  end

  chart_data
end

def get_team_charts(games)
  chart_data = []
  dow = %w(Sunday Monday Tuesday Wednesday Thursday Friday Saturday)
  count = Array.new(7, 0)
  for g in games.each
    day, hour = dateTime(g, '%w', '%H')
    count[day.to_i] += 1
  end

  i = 0
  for c in count.each
    chart_data << {
      day: dow[i],
      count: c
    }
    i += 1
  end

  chart_data
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

# recalculate all the stats and populate the history stat tables
def recalc
  puts 'Calculating games played'
  recalc_games_played
  puts 'Calculating Elo'
  recalc_elo
  puts 'Calculating win rate'
  recalc_win_rate
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

    delta_a, delta_b = calc_elo_delta(rating_a, score_a, rating_b, score_b,
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

# returns the respective elo deltas given two ratings and two scores
def calc_elo_delta(rating_a, score_a, rating_b, score_b,
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

# returns an array of active players
# sorted by PlayerID
# NOTE: index != PlayerID
def get_names
  db = SQLite3::Database.new 'foosey.db'
  db.execute('SELECT DisplayName FROM Player
              WHERE ACTIVE = 1').flatten
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns an array of elo/names
def get_elos
  db = SQLite3::Database.new 'foosey.db'
  db.execute('SELECT DisplayName, Elo from Player
              WHERE ACTIVE = 1 AND GamesPlayed != 0
              ORDER BY Elo DESC')
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# returns an array of win rates
# sorted by PlayerID
# NOTE: index != PlayerID
def get_win_rates
  db = SQLite3::Database.new 'foosey.db'
  db.execute 'SELECT DisplayName, WinRate from Player
              WHERE ACTIVE = 1 AND GamesPlayed != 0
              ORDER BY WinRate DESC'
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# Return Slack-friendly stats output
def slack_stats
  elos = get_elos.map { |x| x.join(', ') }
  win_rates = get_win_rates.map do |x|
    name = x[0]
    win_rate = format('%.1f%%', x[1] ? x[1] * 100 : 0)
    "#{name}: #{win_rate}"
  end

  stats = [
    fields:
    [
      {
        title: 'Elo Rating',
        value: elos.join("\n"),
        short: true
      },
      {
        title: 'Win Rate',
        value: win_rates.join("\n"),
        short: true
      }
    ]
  ]

  make_response('*Here are all the stats for your team:*', stats)
end

def slack_add_game(text)
  # nice regex to match basic score input
  return help_message unless text =~ /\A(\s*\w+\s+\d+\s*){2,}\z/

  # grittier checking
  db = SQLite3::Database.new 'foosey.db'

  max_score = db.get_first_value 'SELECT Value FROM Config
                               WHERE Setting = "MaxScore"'

  players = db.execute('SELECT DisplayName FROM Player').flatten

  players.map!(&:downcase)

  text_split = text.split(' ').each_slice(2).to_a

  # verify and build outcome hash
  outcome = {}
  text_split.each do |p|
    unless players.include? p.first.downcase
      return make_response("Unknown player: #{p.first}")
    end

    unless p.last.to_i >= 0 && p.last.to_i <= max_score
      return make_response("Invalid score: #{p.last}")
    end

    outcome[p.first] = p.last.to_i
  end

  # add the game to the database
  add_game(outcome)

  unless text_split.length == 2 || text_split.length == 4
    return make_response('Game added!')
  end

  # calculate deltas for each player and generate slack-friendly field hashes
  elo_deltas = []
  text_split.each do |p|
    player_id = db.get_first_value 'SELECT PlayerID FROM Player
                                    WHERE DisplayName = :name
                                    COLLATE NOCASE', p.first
    elo = db.get_first_value 'SELECT Elo FROM Player
                              WHERE PlayerID = :player_id', player_id
    delta = get_last_elo_change(player_id)

    elo_deltas << {
      title: p.first,
      value: "#{elo} (#{'+' if delta > 0}#{delta})",
      short: true
    }
  end
  attachments = [
    pretext: 'Elo change after that game:',
    fields: elo_deltas
  ]
  make_response('Game added!', attachments)
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
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

def history(player1, player2, content)
  if player1.include? '&'
    team1 = player1.split('&')
    team2 = player2.split('&')
    p1Index = $names.find_index(team1[0])
    p2Index = $names.find_index(team1[1])
    p3Index = $names.find_index(team2[0])
    p4Index = $names.find_index(team2[1])
    player1 = "#{team1[0].capitalize}&#{team1[1].capitalize}"
    player2 = "#{team2[0].capitalize}&#{team2[1].capitalize}"
    history4 = true
  else
    p1Index = $names.find_index(player1)
    p2Index = $names.find_index(player2)
  end
  games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
  text = ''
  for g in games.each
    thisGame = g.split(',')
    local = Time.at(thisGame.shift.to_i).getlocal($UTC)
    date = local.strftime('%m/%d/%Y')
    name = thisGame.shift
    numPlayers = players_in_game(g)
    if numPlayers == 2 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1'
      text = "#{date} -\t#{player1.capitalize}: #{thisGame[p1Index]}\t#{player2.capitalize}: #{thisGame[p2Index]}\n" + text
    elsif history4 && numPlayers == 4 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1' && thisGame[p3Index] != '-1' && thisGame[p4Index] != '-1'
      text = "#{date} -\t#{player1}: #{thisGame[p1Index]}\t#{player2}: #{thisGame[p3Index]}\n" + text
    end
  end
  history = [{
    pretext: "Full game history between #{player1.capitalize} and #{player2.capitalize}:",
    text: text
  }]
  history
end

# get a set number of games as json
# start is the index to start at, starting with the most recent game
# limit is the number of games to return from that starting point
# allHistory(content, 0, 50) would return the 50 most recent games
def allHistory(content, start, limit)
  games = content.split("\n")[1..-1] # convert csv to all games
  allGames = []
  i = -1

  # limit the number of games returned
  start = games.length - start.to_i - 1
  start = -1 if start < 0 || start >= games.length
  limit = limit == '' ? 0 : games.length - limit.to_i
  limit = 0 if limit < 0 || limit > start

  # keep track of elo
  elo = Array.new($names.length, 1200)
  total_games = Array.new($names.length, 0)

  for g in games.each
    elo, total_games, change = calculate_elo_change(g, elo, total_games)
    i += 1

    # skip returning it if it's not in the range we're looking for
    next if i < limit || i > start

    date, time = dateTime(g, '%m/%d/%Y', '%H:%M')
    teams = []
    game = g.split(',')[2..-1]

    teams = getTeamNamesAndScores(g, change)

    allGames.unshift(id: i,
                     date: date,
                     time: time,
                     teams: teams)
  end
  allGames
end

def getTeamNamesAndScores(g, change)
  teams = []
  game = g.strip.split(',')[2..-1]
  max = game.max { |a, b| a.to_i <=> b.to_i }
  i = 0

  # if 2 players
  if players_in_game(g) == 2
    # get indexes
    p_a = game.index { |p| p != '-1' }
    p_b = game.rindex { |p| p != '-1' }

    teams << {
      players: [$names[p_a].capitalize],
      score: game[p_a].to_i,
      change: change[p_a]
    }

    teams << {
      players: [$names[p_b].capitalize],
      score: game[p_b].to_i,
      change: change[p_b]
    }

  # if 4 players
  elsif players_in_game(g) == 4
    # get indexes of winners
    t_a_p_a = game.index { |p| p == max }
    t_a_p_b = game.rindex { |p| p == max }

    # get indexes of losers
    t_b_p_a = game.index { |p| p != '-1' && p != max }
    t_b_p_b = game.rindex { |p| p != '-1' && p != max }

    teams << {
      players: [$names[t_a_p_a].capitalize, $names[t_a_p_b].capitalize],
      score: game[t_a_p_a].to_i,
      change: change[t_a_p_a]
    }

    teams << {
      players: [$names[t_b_p_a].capitalize, $names[t_b_p_b].capitalize],
      score: game[t_b_p_a].to_i,
      change: change[t_b_p_a]
    }

  else
    for p in game.each
      if p != '-1'
        teams << {
          players: [$names[i].capitalize],
          score: p.to_i
        }
      end
      i += 1
    end
  end

  teams.sort! { |a, b| b[:score] <=> a[:score] }

  teams
end

def record_safe(player1, player2, content)
  return make_response('Please pass two different valid names to `foosey history`') if player1 == player2 || !$names.include?(player1) || !$names.include?(player2)
  record = record(player1, player2, content)
  history = history(player1, player2, content)
  for item in history.each
    record << item
  end
  make_response(' ', record)
end

# function to return the record between two players as an attachment
def record(player1, player2, content)
  if player1.include? '&'
    team1 = player1.split('&')
    team2 = player2.split('&')
    p1Index = $names.find_index(team1[0])
    p2Index = $names.find_index(team1[1])
    p3Index = $names.find_index(team2[0])
    p4Index = $names.find_index(team2[1])
    player1 = "#{team1[0].capitalize}&#{team1[1].capitalize}"
    player2 = "#{team2[0].capitalize}&#{team2[1].capitalize}"
    history4 = true
  else
    p1Index = $names.find_index(player1)
    p2Index = $names.find_index(player2)
    player1 = player1.capitalize
    player2 = player2.capitalize
    history2 = true
  end
  games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
  team1Score = 0
  team2Score = 0
  for g in games.each
    thisGame = g.split(',')[2..-1]
    numPlayers = players_in_game(g)
    if history2 && numPlayers == 2 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1'
      if thisGame[p1Index].to_i > thisGame[p2Index].to_i
        team1Score += 1
      else
        team2Score += 1
      end
    elsif history4 && numPlayers == 4 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1' && thisGame[p3Index] != '-1' && thisGame[p4Index] != '-1' && thisGame[p1Index] == thisGame[p2Index] && thisGame[p3Index] == thisGame[p4Index]
      if thisGame[p1Index].to_i > thisGame[p3Index].to_i
        team1Score += 1
      else
        team2Score += 1
      end
    end
  end

  record = [
    pretext: "Current record between #{player1} and #{player2}:",
    fields: [
      {
        title: player1.to_s,
        value: team1Score.to_s,
        short: true
      },
      {
        title: player2.to_s,
        value: team2Score.to_s,
        short: true
      }
    ]
  ]
  record
end

# function to predict the score between two players
def predict(content, cmd)
  games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
  elo_ah = get_elos(games)[0]
  players = cmd.split(' ')
  return make_response('Please pass two different valid names to `foosey predict`') if
      players.length != 2 || elo_ah.index { |p| p[:name] == players[0] }.nil? || elo_ah.index { |p| p[:name] == players[1] }.nil? || players[0] == players[1]
  elo_ah.keep_if { |p| p[:name] == players[0] || p[:name] == players[1] } # this array will already be in order by elo
  player_a = elo_ah[0] # higher elo
  player_b = elo_ah[1] # lower elo
  r_a = player_a[:elo]
  r_b = player_b[:elo]
  win_weight = 1.2
  e_b = 1 / (1 + 10**((r_a - r_b) / 800.to_f))
  i = 0
  while i < 10
    e = (i / (i + 10).to_f)**win_weight
    return make_response("Predicted score: #{player_a[:name].capitalize} 10 #{player_b[:name].capitalize} #{i}") if
        e >= e_b
    i += 1
  end
  make_response('Predicted score: To close to tell!')
end

# takes a game_id and produces a nice string of the game results
# useful for slack
def game_to_s(game_id)
  db = SQLite3::Database.new 'foosey.db'

  game = create_query_hash(db.execute2('SELECT p.DisplayName, g.Score
                                        FROM Game g
                                        JOIN Player p
                                        USING (PlayerID)
                                        WHERE g.GameID = :game_id
                                        ORDER BY g.Score DESC', game_id))

  s = ""
  game.each do |player|
    s << "#{player['DisplayName']} #{player['Score']} "
  end

  s.strip
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
  end
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# undo the last game via slack
def slack_undo
  db = SQLite3::Database.new 'foosey.db'

  game_id = db.get_first_value 'SELECT GameID FROM Game
                                ORDER BY Timestamp DESC
                                LIMIT 1'

  # get the game string
  s = game_to_s game_id

  # remove the game
  # don't recalc
  remove_game game_id, false

  # update respective player entries
  # this is faster than recalc since we just have to set to the last thing
  players.each do |p|
    db.execute 'UPDATE Player SET Elo = (
                  SELECT Elo FROM EloHistory e
                  JOIN Game g
                  USING (GameID)
                  WHERE g.PlayerID = :player_id
                  ORDER BY g.Timestamp DESC
                  LIMIT 1
                ) WHERE PlayerID = :player_id', p

    db.execute 'UPDATE Player SET WinRate = (
                  SELECT WinRate FROM WinRateHistory w
                  JOIN Game g
                  USING (GameID)
                  WHERE g.PlayerID = :player_id
                  ORDER BY g.Timestamp DESC
                  LIMIT 1
                ) WHERE PlayerID = :player_id', p

    db.execute 'UPDATE Player SET GamesPlayed = (
                  SELECT COUNT(*) FROM Game
                  WHERE PlayerID = :player_id
                ) WHERE PlayerID = :player_id', p

  make_response("Game removed: #{s}")
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

# function to remove specific game
def remove(id, content)
  games = content.split("\n")
  toRemove = games.at(id.to_i + 1)
  games.delete_at(id.to_i + 1)
  content = games.join("\n")
  File.write('games.csv', content)
  response = `curl --silent -X POST --data-urlencode 'payload={"channel": "@matttt", "username": "foosey", "text": "Someone used the app to remove:\n#{toRemove}", "icon_emoji": ":foosey:"}' #{$slack_url}`
  'Removed'
end

# function to verify the input from slack
def verify_input(text)
  game = text.split(' ')
  return 'help' if game.length.odd? || game.length < 4 # at least two players
  games_n = game.values_at(* game.each_index.select(&:even?)) # oh ruby, you so fine
  return 'No duplicate players in a game!' if games_n.length > games_n.map { |g| g }.uniq.length
  for i in 0..game.length - 1
    if i.even? # names
      return "No user named `#{game[i]}` being logged." unless $names.include?(game[i])
    else
      return 'help' unless game[i] =~ /^[-+]?[0-9]*$/
      return 'Please enter whole numbers greater than 0.' unless game[i].to_i >= 0
    end
  end
  'good'
end

def getInsult
  insult = `curl --silent http://www.insultgenerator.org/ | grep "<br><br>"`
  insult = insult.split('<br><br>')[1].split('<')[0].gsub('&nbsp;', ' ').gsub('&#44;', ',')
  insult
end

def getPlayers(names)
  players = []
  for p in names.each
    players << {
      name: p,
      selected: false
    }
  end
  players
end

def addUser(name, content)
  newContent = "#{content.lines.first.delete("\n")},#{name}"
  split = content.split("\n")[1..-1]
  for i in 0..split.length - 1
    newContent += "\n#{split[i].delete("\n")},-1"
  end
  newContent
end

def total(games)
  total_wins = Array.new($names.length, 0)
  total_games = Array.new($names.length, 0)
  for g in games.each # for each player
    g_a = g.strip.split(',')[2..-1] # turn the game into an array of scores
    max = g_a.max { |a, b| a.to_i <=> b.to_i }
    for i in 0..g_a.length - 1 # for each player
      # the +1s in here are to prevent off-by-ones because names starts at 0 and scores start at 1 because of timestamp
      total_wins[i] += 1 if g_a[i].to_i == max.to_i # if they won, increment wins
      total_games[i] += 1 unless g_a[i].to_i == -1 # increment total games
    end
  end

  totals = []

  stats = ''
  for i in 0..$names.length - 1
    unless $ignore.include? $names[i]
      wins = total_wins[i] == 0 ? 0 : (total_wins[i].to_f * 100 / total_games[i].to_f)
      totals << { name: $names[i], percent: wins } unless total_games[i] == 0
    end
  end

  totals = totals.sort { |a, b| b[:percent] <=> a[:percent] } # cheeky sort

  return totals if $app

  for i in 0..totals.length - 1
    stats += "#{totals[i][:name].capitalize}: #{totals[i][:percent].to_i}%\n"
  end

  stats
end

# function to return date and time
def dateTime(g, dateFormat, timeFormat)
  thisGame = g.split(',')
  local = Time.at(thisGame.shift.to_i).getlocal($UTC)
  date = local.strftime(dateFormat)
  time = local.strftime(timeFormat)

  [date, time]
end

def slack(user_name, text, trigger_word)
  $app = false

  # Clean up text
  text ||= ''
  text = text.downcase.delete ':' # emoji support

  # Remove 'foosey' from the beginning of the text
  text = text[trigger_word.length..text.length].strip if trigger_word

  # set args
  args = text.split(' ')

  # case for command
  case args[0]
  when 'help'
    help_message
  when 'stats'
    slack_stats
  when 'predict'
    # NYI
  when 'undo'
    slack_undo
  when 'history'
    # NYI
  when 'add'
    return succinct_help unless admin? user_name
    add_player(args[1], args[2])
    make_response('Player added!')
  when 'update'
    return succinct_help unless admin? user_name
    update
    make_response('My name is foosey. You killed my father. Prepare to die.\nJust kidding, but that new code is too :dank:')
  when 'recalc'
    return succinct_help unless admin?(user_name)
    puts 'Starting recalc...'
    recalc
    slack_stats
  else
    # add game
    slack_add_game(text)
  end
end

def log_game_from_app(user_name, text)
  $app = true

  # Get latest paste's content
  content = File.read('games.csv')
  $names = content.lines.first.strip.split(',')[2..-1] # drop the first two items, because they're "time" and "who"
  games = content.split("\n")[1..-1]

  # Clean up text and set args
  text ||= ''
  text = text.downcase.delete(':')
  args = text.split(' ')

  # App specific cases
  if text.start_with? 'charts'
    return {
      charts: get_charts(args[1], games)
    }
  elsif text.start_with? 'leaderboard'
    return {
      elos: get_elos(games)[0],
      avgs: get_avg_scores(games),
      percent: total(games)
    }
  elsif text.start_with? 'history'
    return {
      games: allHistory(content, args[1], args[2])
    }
  elsif text.start_with? 'players'
    return {
      players: getPlayers($names - $ignore)
    }
  elsif text.start_with? 'remove'
    return {
      response: remove(args[1], content)
    }
  elsif text.start_with? 'team'
    return {
      charts: get_team_charts(games)
    }
  end

  # Verify data
  result = verify_input(text)
  if result != 'good'
    if result == 'help'
      return succinct_help
    else
      return make_response(result)
    end
  end

  # add game
  add_game(text, content, user_name)
end
