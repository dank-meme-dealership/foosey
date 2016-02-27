# foosey API calls
# for more information see API.md

namespace '/v1' do
  # Player Information
  # All Players / Multiple Players
  get '/players' do
    begin
      # if ids is set, we have a filter
      ids = params['ids'].split ',' if params['ids']

      db = SQLite3::Database.new 'foosey.db'

      db.results_as_hash = true
      stmt = 'SELECT * FROM Player'
      # add conditional if ids is defined
      stmt << ' WHERE PlayerID IN (' + ids.join(',') + ')' if ids

      response = []

      # i don't like making an actual string for the statement rather than
      # doing parameters, but it seems like we have to when doing IN
      db.execute stmt do |player|
        response << {
          playerID: player['PlayerID'],
          displayName: player['DisplayName'],
          elo: player['Elo'],
          winRate: player['WinRate'],
          gamesPlayed: player['GamesPlayed'],
          admin: player['Admin'] == 1,
          active: player['Active'] == 1
        }
      end

      json response
    rescue SQLite3::Exception => e
      puts e
      500 # Internal server error
    ensure
      db.close if db
    end
  end

  # One Player
  get '/players/:id' do
    begin
      id = params['id'].to_i

      db = SQLite3::Database.new 'foosey.db'

      db.results_as_hash = true
      player = db.execute('SELECT * FROM Player
                              WHERE PlayerID = :id', id).first

      return json(
        error: true,
        message: 'Invalid player ID.'
      ) if player.nil?

      json(
        playerID: player['PlayerID'],
        displayName: player['DisplayName'],
        elo: player['Elo'],
        winRate: player['WinRate'],
        gamesPlayed: player['GamesPlayed'],
        admin: player['Admin'] == 1,
        active: player['Active'] == 1
      )
    rescue SQLite3::Exception => e
      puts e
      500 # Internal server error
    ensure
      db.close if db
    end
  end

  # Game Information
  # Games a Player Has Played In
  get '/players/:id/games' do
    id = params['id'].to_i

    501 # Not yet implemented
  end

  # All Games / Multiple Games
  get '/games' do
    # if ids is set, we have a filter
    ids = params['ids'].split ',' if params['ids']

    # set limit and offset if they were defined
    limit = params['limit'].to_i if params['limit']
    offset = params['offset'].to_i if params['offset']

    501 # Not yet implemented
  end

  # One Game
  get '/games/:id' do
    id = params['id'].to_i

    501 # Not yet implemented
  end

  # Statistics
  # Player Elo History
  get '/stats/elo/:id' do
    id = params['id'].to_i

    501 # Not yet implemented
  end

  # Player Win Rate History
  get '/stats/winrate/:id' do
    id = params['id'].to_i

    501 # Not yet implemented
  end

  # Adding Objects
  # Add Game
  post '/add/game' do
    body = JSON.parse request.body.read

    501 # Not yet implemented
  end

  # Add Player
  post '/add/player' do
    body = JSON.parse request.body.read

    501 # Not yet implemented
  end

  # Editing Objects
  # Edit Game
  post '/edit/game' do
    body = JSON.parse request.body.read

    501 # Not yet implemented
  end

  # Edit Player
  post '/edit/player' do
    body = JSON.parse request.body.read

    501 # Not yet implemented
  end

  # Removing Objects
  # Remove Game
  delete '/remove/game/:id' do
    id = params['id'].to_i

    501 # Not yet implemented
  end

  # Remove Player
  delete '/remove/player/:id' do
    id = params['id'].to_i

    501 # Not yet implemented
  end
end
