# foosey API calls
# for more information see API.md

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
      namespace '/:league_id' do
        # Player Information
        # All Players / Multiple Players
        get '/players' do
          # set ids to params, or all player ids
          ids = params['ids'].split ',' if params['ids']
          ids ||= League.new(params['league_id']).player_ids
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
          offset = params['offset'].to_i if params['offset']
          ids = Player.new(id).game_ids
          limit ||= ids.length
          offset ||= 0

          ids = ids[offset, limit]
          # fix if offset is too high, return empty array
          ids ||= []

          json ids.collect { |i| Game.new(i).to_h }
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
          ids ||= League.new(params['league_id']).game_ids
          limit ||= ids.length
          offset ||= 0

          ids = ids[offset, limit]
          # fix if offset is too high, return empty array
          ids ||= []

          json ids.collect { |id| Game.new(id).to_h }
        end

        # One Game
        get '/games/:id' do
          id = params['id'].to_i
          json Game.new(id).to_h
        end

        # Statistics
        # Player Elo History
        get '/stats/elo/:id' do
          id = params['id'].to_i
          json Player.new(id).elo_history
        end

        # Players Elo History
        get '/stats/elo' do
          ids = params['ids'].split ',' if params['ids']
          ids ||= League.new(params['league_id']).player_ids

          json(ids.collect do |id|
            {
              playerID: id,
              elos: Player.new(id).elo_history
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

          game = Game.create(outcome, params['league_id'], body['timestamp'])

          puts game.inspect

          json(
            error: false,
            message: 'Game added.',
            info: {
                gameID: game.id,
                player_ids: game.player_ids.collect do |player_id|
                player = Player.new(player_id)
                {
                  name: player.display_name,
                  elo: player.elo,
                  delta: game.delta(player_id)
                }
              end
            }
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
end
