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
  help =
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
  make_response(help)
end

def succinct_help
  help = "I couldn't figure out what you were trying to do, to see what I can do try `foosey help`"
  make_response(help)
end

def add_game(text, content, user_name)
  # Add last game from slack input
  now = Time.now.to_i
  game = text.split(' ') # get the game information
  i = 0
  new_game = Array.new($names.length + 2, -1)
  new_game[0] = now # set first column to timestamp
  new_game[1] = "@#{user_name}" # set second column to slack username
  while i < game.length
    name_column = $names.find_index(game[i]) + 2 # get column of person's name
    new_game[name_column] = game[i + 1].to_i # to_i should be safe here since we've verified input earlier
    i += 2
  end
  max = new_game[2..-1].max

  lastGame = content.split("\n").pop.split(',')[2..-1].join(',')
  lastGameUsername = content.split("\n").pop.split(',')[1]
  thisGame = new_game[2..-1].join(',') # complicated way to join
  thisGameJoined = new_game.join(',')

  content += "\n" + thisGameJoined # add this game to the paste content

  # update game
  File.write('games.csv', content)

  # set up attachments
  attach = []
  players = players_in_game(thisGameJoined)
  if players == 2 || players == 4
    # if 2 players
    if players == 2
      # get record
      record = record(game[0], game[2], content)
    # if 4 players
    else
      # get record
      team1 = []
      team2 = []
      i = 0
      while i < game.length
        if game[i + 1] == max
          team1 << game[i]
        else
          team2 << game[i]
        end
        i += 2
      end
      record = record(team1.join('&').to_s, team2.join('&').to_s, content)
    end

    # add them to the attachments
    attach << get_change(content, new_game[2..-1])
    attach << record[0]
  end

  message_slack(new_game[2..-1], text, attach) if $app

  if lastGame != thisGame
    make_response('Game added!', attach)
  else
    make_response("Game added!\nThis game has the same score as the last game that was added. If you added this game in error you can undo this action.", attach)
  end
end

def get_change(content, newGame)
  games = content.split("\n")[1..-1]

  elos, change = get_elos(games)

  fields = []
  newGame.each_index do |i|
    if newGame[i] != -1
      person = elos.select { |person| person[:name].downcase == $names[i] }[0]
      elo = person[:elo]
      elo_change = change[i].to_i >= 0 ? "+#{change[i]}" : change[i]
      fields << {
        title: $names[i].capitalize,
        value: "#{elo} (#{elo_change})",
        short: true
      }
    end
  end

  change = {
    pretext: "Elos after that game:",
    fields: fields
  }

  change
end

# function to calculate average scores
def get_avg_scores(games)
  total_scores = Array.new($names.length, 0)
  total_games = Array.new($names.length, 0)
  games.each do |g| # for each player
    g_a = g.strip.split(',')[2..-1] # turn the game into an array of scores
    g_a.each_with_index do |value, idx| # for each player
      # the +1s in here are to prevent off-by-ones because names starts at 0 and scores start at 2 because of timestamp and
      total_scores[idx] += value.to_i unless value.to_i == -1 # if they played, increment score
      total_games[idx] += 1 unless value.to_i == -1 # and total num games
    end
  end

  avg_score = []
  averages = ''
  # total_played = ""
  $names.each_with_index do |n, idx|
    avg_score << { name: n, avg: total_scores[idx] / (total_games[idx] * 1.0) } unless total_games[idx] == 0 or $ignore.include? n
    # total_played += "#{$names[i].capitalize}: #{total_games[i]}\n" unless total_games[i] == 0
  end

  avg_score = avg_score.sort { |a, b| b[:avg] <=> a[:avg] } # cheeky sort

  return avg_score if $app

  avg_score.each do |s|
    averages += "#{s[:name].capitalize}: #{'%.2f' % s[:avg]}\n"
  end

  averages
  # return make_response("*Here are all of the statistics for your team:*", statistics)
end

def calculate_elo_change(g, elo, total_games)
  change = Array.new($names.length, 0) # empty no change array

  # quit out unless a 2 or 4 person game
  return elo, total_games, change if players_in_game(g) != 2 && players_in_game(g) != 4

  prev = elo.dup

  k_factor = 50 # we can play around with this, but chess uses 15 in most skill ranges

  g_a = g.strip.split(',')[2..-1]
  max = g_a.max
  # variable names from here out are going to be named after those mentioned here:
  # http://www.chess.com/blog/wizzy232/how-to-calculate-the-elo-system-of-rating

  # if 2 players
  if players_in_game(g) == 2
    # get indexes
    p_a = g_a.index { |p| p != '-1' }
    p_b = g_a.rindex { |p| p != '-1' }

    # then get points
    p_a_p = g_a[p_a].to_i
    p_b_p = g_a[p_b].to_i

    # then get previous elos
    r_a = elo[p_a]
    r_b = elo[p_b]

  # if 4 players
  else
    # get indexes of winners
    t_a_p_a = g_a.index { |p| p == max }
    t_a_p_b = g_a.rindex { |p| p == max }

    # get indexes of losers
    t_b_p_a = g_a.index { |p| p != '-1' && p != max }
    t_b_p_b = g_a.rindex { |p| p != '-1' && p != max }

    # then get points
    p_a_p = g_a[t_a_p_a].to_i
    p_b_p = g_a[t_b_p_a].to_i

    # then get team elos
    r_a = ((elo[t_a_p_a] + elo[t_a_p_b]) / 2).round
    r_b = ((elo[t_b_p_a] + elo[t_b_p_b]) / 2).round
  end

  # do shit
  e_a = 1 / (1 + max.to_i**((r_b - r_a) / 800.to_f))
  e_b = 1 / (1 + max.to_i**((r_a - r_b) / 800.to_f))
  # method 1: winner gets all
  # s_a = p_a_p > p_b_p ? 1 : 0
  # s_b = 1 - s_a
  # method 2: add a weight to winner
  win_weight = 1.2
  s_a = p_a_p / (p_a_p + p_b_p).to_f
  if s_a < 0.5
    s_a **= win_weight
    s_b = 1 - s_a
  else
    s_b = (1 - s_a)**win_weight
    s_a = 1 - s_b
  end
  r_a_n = (k_factor * (s_a - e_a)).round
  r_b_n = (k_factor * (s_b - e_b)).round

  # if 2 players
  if players_in_game(g) == 2
    # add back to elos
    elo[p_a] += r_a_n
    elo[p_b] += r_b_n

    # add to player total games
    total_games[p_a] += 1
    total_games[p_b] += 1

  # if 4 players
  else
    # add winner elos
    elo[t_a_p_a] += r_a_n
    elo[t_a_p_b] += r_a_n

    # subtract loser elos
    elo[t_b_p_a] += r_b_n
    elo[t_b_p_b] += r_b_n

    # add to player total games
    total_games[t_a_p_a] += 1
    total_games[t_a_p_b] += 1
    total_games[t_b_p_a] += 1
    total_games[t_b_p_b] += 1
  end

  change = prev.zip(elo).map { |x, y| y - x }

  [elo, total_games, change]
end

# calculates singles elo and returns array hash
def get_elos(games)
  now = Time.at(Time.now.to_i).getlocal($UTC)
  elo = Array.new($names.length, 1200)
  total_games = Array.new($names.length, 0)
  all = []
  change = ''

  games_c = games.dup
  g_i = 0
  for g in games_c.each # adjust players elo game by game

    elo, total_games, change = calculate_elo_change(g, elo, total_games)

    gameTime = Time.at(g.split(',')[0].to_i).getlocal($UTC)
    all.unshift(change) if Time.at(now).to_date === Time.at(gameTime).to_date

    g_i += 1
  end

  elo_ah = []
  for i in 0...$names.length
    unless $ignore.include? $names[i]
      elo_ah << { name: $names[i], elo: elo[i], change: all.map { |a| a[i] }.inject(:+), games: total_games[i] } unless total_games[i] == 0
    end
  end
  sorted = elo_ah.sort { |a, b| b[:elo] <=> a[:elo] } # sort the shit out of it, ruby style
  [sorted, change]
end

# function to display elo
def get_elo(games)
  elo_ah = get_elos(games)[0]
  elo_s = ''
  for i in 0...elo_ah.length
    elo_s += "#{elo_ah[i][:name].capitalize}: #{elo_ah[i][:elo]}\n" unless $ignore.include? elo_ah[i][:name]
  end

  elo_s
end

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
    max = g_a.max
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

# function to calculate stats breh
def stats(content)
  games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
  elo = get_elo(games)
  avg = get_avg_scores(games)

  stats = [
    fields:
    [
      {
        title: 'Elo Rating:',
        value: elo,
        short: true
      },
      {
        title: 'Average Score:',
        value: avg,
        short: true
      }
    ]
  ]

  make_response('*Here are all of the stats for your team:*', stats)
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
  max = game.max
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

# function to undo the last move
def undo(content)
  games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
  last = games.pop.split(',')[1..-1]
  username = last.shift
  response = "Removed the game added by #{username}:"
  i = 0
  content = content.split("\n")[0...-1].join("\n")
  for g in last.each
    response += "\n#{$names[i].capitalize}: #{g}" if g != '-1'
    i += 1
  end
  File.write('games.csv', content)
  make_response(response)
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
    max = g_a.max
    for i in 0..g_a.length - 1 # for each player
      # the +1s in here are to prevent off-by-ones because names starts at 0 and scores start at 1 because of timestamp
      total_wins[i] += 1 if g_a[i].to_i == max # if they won, increment wins
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

def log_game_from_slack(user_name, text, trigger_word)
  $app = false

  # Get latest paste's content
  content = File.read('games.csv')
  $names = content.lines.first.strip.split(',')[2..-1] # drop the first two items, because they're "time" and "who"
  games = content.split("\n")[1..-1]

  # Clean up text and set args
  text ||= ''
  text = text.downcase.delete(':')
  args = text.split(' ')

  # Remove 'foosey' from the beginning of the text
  text = text[trigger_word.length..text.length].strip if trigger_word

  # Cases other than adding a game
  if text.start_with? 'help'
    return help_message
  elsif text.start_with? 'stats'
    return stats(content)
  elsif text.start_with? 'predict'
    return predict(content, text['predict'.length..text.length].strip)
  elsif text.start_with? 'easter'
    return make_response($middle)
  elsif text.start_with? 'undo'
    return undo(content)
  elsif text.start_with? 'history'
    return record_safe(args[1], args[2], content)
  elsif text.start_with? 'record'
    return make_response('`foosey record` has been renamed `foosey history`')
  elsif text.start_with? 'add'
    return succinct_help unless $admins.include? user_name
    content = addUser(args[1], content)
    File.write('games.csv', content)
    return make_response('Player added!')
  elsif text.start_with? 'update' and $admins.include? user_name
    update
    return make_response("I'm up to date.")
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
