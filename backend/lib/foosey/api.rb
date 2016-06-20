# foosey API calls
# for more information see API.md

# returns an api object for player elo history
def api_stats_elo(player_id, league_id = 1)
  database do |db|
    db.results_as_hash = true
    games = db.execute 'SELECT * FROM EloHistory
                        JOIN (
                          SELECT PlayerID, GameID, Timestamp FROM Game
                        )
                        USING (PlayerID, GameID)
                        WHERE PlayerID = :player_id
                        AND LeagueID = :league_id
                        ORDER BY Timestamp DESC
                        LIMIT 30;', player_id, league_id

    return games.collect do |game|
      {
        gameID: game['GameID'],
        timestamp: game['Timestamp'],
        elo: game['Elo']
      }
    end
  end
end

module Foosey
  class API < Sinatra::Base
    register Sinatra::Namespace

    configure do
      enable :cross_origin
      set :port, 4005
      set :allow_methods, [:get, :post, :options, :delete, :put]
      set :show_exceptions, false
    end

    # options workaround as defined in sinatra-cross_origin gem
    options '*' do
      response.headers['Allow'] = 'HEAD,GET,PUT,POST,DELETE,OPTIONS'

      response.headers['Access-Control-Allow-Headers'] =
        'X-Requested-With, X-HTTP-Method-Override, ' \
        'Content-Type, Cache-Control, Accept'

      200
    end

    namespace '/v1' do
      # Player Information
      # All Players / Multiple Players
      get '/players' do
        # set ids to params, or all player ids
        ids = params['ids'].split ',' if params['ids']
        ids ||= League.new.players
        json ids.collect { |id| Player.new(id).to_h }
      end

      # One Player
      get '/players/:id' do
        id = params['id'].to_i
        json Player.new(id).to_h true
      end

      # Game Information
      # Games a Player Has Played In
      get '/players/:id/games' do
        id = params['id'].to_i
        limit = params['limit'].to_i if params['limit']
        ids = games_with_player id
        limit ||= ids.length

        ids = ids[0, limit]

        json ids.collect { |i| api_game i }
      end

      # Badges
      # All Players
      get '/badges' do
        json badges
      end

      # All Games / Multiple Games
      get '/games' do
        # set params and their defaults1
        ids = params['ids'].split ',' if params['ids']
        limit = params['limit'].to_i if params['limit']
        offset = params['offset'].to_i if params['offset']
        ids ||= game_ids
        limit ||= ids.length
        offset ||= 0

        ids = ids[offset, limit]
        # fix if offset is too high, return empty array
        ids ||= []

        json ids.collect { |id| api_game id }
      end

      # One Game
      get '/games/:id' do
        id = params['id'].to_i
        json api_game id
      end

      # Statistics
      # Player Elo History
      get '/stats/elo/:id' do
        id = params['id'].to_i
        json api_stats_elo id
      end

      # Players Elo History
      get '/stats/elo' do
        ids = params['ids'].split ',' if params['ids']
        ids ||= player_ids

        json(ids.collect do |id|
          {
            playerID: id,
            elos: api_stats_elo(id)
          }
        end)
      end

      # Adding Objects
      # Add Game
      post '/games' do
        body = JSON.parse request.body.read

        outcome = {}
        body['teams'].each do |team|
          team['players'].each { |p| outcome[p] = team['score'] }
        end

        info = add_game(outcome, body['timestamp'])

        json(
          error: false,
          message: 'Game added.',
          info: info
        )
      end

      # Add Player
      post '/players' do
        body = JSON.parse request.body.read

        # set some default values
        admin = body['admin']
        admin = false if admin.nil?
        active = body['active']
        active = true if active.nil?

        add_player(body['displayName'], body['slackName'], admin, active)

        json(
          error: false,
          message: 'Player added.'
        )
      end

      # Editing Objects
      # Edit Game
      put '/games/:id' do
        id = params['id'].to_i
        body = JSON.parse request.body.read

        unless valid_game? id
          return json(
            error: true,
            message: 'Invalid game ID: #{id}'
          )
        end

        outcome = {}
        body['teams'].each do |team|
          team['players'].each { |p| outcome[p] = team['score'] }
        end

        edit_game(id, outcome, body['timestamp'])

        json(
          error: false,
          message: 'Game updated.'
        )
      end

      # Edit Player
      put '/players/:id' do
        id = params['id'].to_i
        body = JSON.parse request.body.read

        unless valid_player? id
          return json(
            error: true,
            message: 'Invalid player ID: #{id}'
          )
        end

        edit_player(id, body['displayName'], body['slackName'],
                    body['admin'], body['active'])

        json(
          error: false,
          message: 'Player updated.'
        )
      end

      # Removing Objects
      # Remove Game
      delete '/games/:id' do
        id = params['id'].to_i

        unless valid_game? id
          return json(
            error: true,
            message: 'Invalid game ID: #{id}'
          )
        end

        remove_game(id)

        json(
          error: false,
          message: 'Game removed.'
        )
      end

      post '/recalc' do
        recalc(0, false)

        json(
          error: false,
          message: 'Stats recalculated.'
        )
      end
    end
  end
end
