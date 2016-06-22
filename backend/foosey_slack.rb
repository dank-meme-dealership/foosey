# foosey slack bot functions

# returns a response object for slack
def make_response(response, attachments = [])
  {
    text: response, # send a text response (replies to channel if not blank)
    attachments: attachments,
    link_names: '1',
    username: 'Foosey',
    icon_url: 'http://api.foosey.futbol/icon.png'
  }
end

def succinct_help
  make_response 'I couldn\'t figure out what you were trying to do; ' \
                'use the Foosey app for better functionality: ' \
                'http://foosey.futbol'
end

# function to make a help message
def help_message
  make_response %(*Usage:*

    To get stats about all players:
    `foosey stats`

    To do anything else:
    http://foosey.futbol)
end

# Return Slack-friendly stats output
def slack_stats
  elos_s = player_elos.map { |x| x.join(': ') }

  stats = [
    {
      fields:
      [
        {
          title: 'Elo Rating',
          value: elos_s.join("\n"),
          short: true
        }
      ]
    }
  ]

  make_response('*Here are all the stats for your team:*', stats)
end

def slack(user_name, args)
  # case for command
  case args[0]
  when 'help'
    help_message
  when 'stats'
    slack_stats
  when 'add'
    return succinct_help unless admin? user_name
    add_player(args[1], args[2])
    make_response('Player added!')
  when 'update'
    return succinct_help unless admin? user_name
    update
    make_response('Foosey has been updated.')
  when 'recalc'
    return succinct_help unless admin?(user_name)
    puts 'Starting recalc...'
    recalc
    slack_stats
  else
    succinct_help
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
