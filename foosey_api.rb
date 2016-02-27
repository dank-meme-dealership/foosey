# foosey API calls
# for more information see API.md

namespace '/v1' do
  # Player Information
  # All Players / Multiple Players
  get '/players' do
    # if ids is set, we have a filter
    ids = params['ids'].split ',' if params['ids']

    501 # Not yet implemented
  end

  # One Player
  get '/players/:id' do
    id = params['id'].to_i

    501 # Not yet implemented
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
