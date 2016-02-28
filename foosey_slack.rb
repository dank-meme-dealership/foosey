# foosey slack bot functions

# returns a response object for slack
def make_response(response, attachments = [])
  {
    text: response, # send a text response (replies to channel if not blank)
    attachments: attachments,
    link_names: '1',
    username: 'foosey', # overwrite configured username (ex: MyCoolBot)
    icon_url: 'http://i.imgur.com/MyGxqRM.jpg', # overwrite configured icon (ex: https://mydomain.com/some/image.png
  }
end

def succinct_help
  make_response "I couldn't figure out what you were trying to do; to see what I can do try `foosey help`"
end

# function to make a help message
def help_message
  make_response %(*Usage:*

    To record a singles game:
    `foosey Matt 10 Conner 1`

    To record a doubles game:
    `foosey Greg 10 Erich 10 Blake 9 Daniel 9`

    To see the full history between two players:
    `foosey history Will Erich`

    To get stats about all players:
    `foosey stats`

    To undo the last game:
    `foosey undo`

    To get this help message:
    `foosey help`)
end

# Return Slack-friendly stats output
def slack_stats
  elos_s = player_elos.map { |x| x.join(': ') }
  win_rates_s = win_rates.map do |x|
    name = x[0]
    win_rate = format('%.1f%%', x[1] ? x[1] * 100 : 0)
    "#{name}: #{win_rate}"
  end

  stats = [
    {
      fields:
      [
        {
          title: 'Elo Rating',
          value: elos_s.join("\n"),
          short: true
        },
        {
          title: 'Win Rate',
          value: win_rates_s.join("\n"),
          short: true
        }
      ]
    }
  ]

  make_response('*Here are all the stats for your team:*', stats)
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
  player_ids.each do |player_id|
    db.execute 'UPDATE Player SET Elo = (
                  SELECT Elo FROM EloHistory e
                  JOIN Game g
                  USING (PlayerID, GameID)
                  WHERE e.PlayerID = :player_id
                  ORDER BY g.Timestamp DESC
                  LIMIT 1
                ) WHERE PlayerID = :player_id', player_id

    db.execute 'UPDATE Player SET WinRate = (
                  SELECT WinRate FROM WinRateHistory w
                  JOIN Game g
                  USING (PlayerID, GameID)
                  WHERE w.PlayerID = :player_id
                  ORDER BY g.Timestamp DESC
                  LIMIT 1
                ) WHERE PlayerID = :player_id', player_id

    db.execute 'UPDATE Player SET GamesPlayed = (
                  SELECT COUNT(*) FROM Game
                  WHERE PlayerID = :player_id
                ) WHERE PlayerID = :player_id', player_id
  end
  make_response("Game removed: #{s}")
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

def slack_history(player1, player2)
  # check the players
  return make_response("Invalid player: #{player1}") unless player_exists? player1
  return make_response("Invalid player: #{player2}") unless player_exists? player2

  # start trackin'
  player1_wins = 0
  player2_wins = 0
  player1_id = id(player1)
  player2_id = id(player2)
  history_s = ''
  games(id(player1), id(player2)).each do |game|
    history_s.prepend(game_to_s(game, true) + "\n") # game with date
    if winner(game) == player1_id
      player1_wins += 1
    else
      player2_wins += 1
    end
  end

  attachments = [
    {
      pretext: "Current record between #{player1.capitalize} and #{player2.capitalize}:",
      fields:
      [
        {
          title: "*#{player1.capitalize}*",
          value: player1_wins,
          short: true
        },
        {
          title: "*#{player2.capitalize}*",
          value: player2_wins,
          short: true
        }
      ]
    },
    {
      pretext: "Full game history between #{player1.capitalize} and #{player2.capitalize}:",
      text: history_s.strip
    }
  ]
  make_response('', attachments)
end

def slack_add_game(text)
  # nice regex to match basic score input
  return succinct_help unless text =~ /\A(\s*\w+\s+\d+\s*){2,}\z/

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

    outcome[id(p.first)] = p.last.to_i
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
    delta = last_elo_change(player_id)

    elo_deltas << {
      title: p.first,
      value: "#{elo} (#{'+' if delta > 0}#{delta})",
      short: true
    }
  end
  attachments = [
    {
      pretext: 'Elo change after that game:',
      fields: elo_deltas
    }
  ]
  make_response('Game added!', attachments)
rescue SQLite3::Exception => e
  puts e
ensure
  db.close if db
end

def slack(user_name, args)
  # case for command
  case args[0]
  when 'help'
    help_message
  when 'stats'
    slack_stats
  when 'undo'
    slack_undo
  when 'history'
    slack_history(args[1], args[2])
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
    slack_add_game(args.join ' ')
  end
end

post '/slack' do
  text = params['text'] || ''
  if params['trigger_word']
    text = text[params['trigger_word'].length..text.length].strip
  end
  args = text.split ' '

  json slack(params['user_name'], args)
end
