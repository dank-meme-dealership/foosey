# foosey API calls
# for more information see API.md

# returns an api object for game with id game_id
def api_game(game_id, league_id)
  database do |db|
    db.results_as_hash = true
    game = db.execute 'SELECT * FROM Game
                       JOIN (
                         SELECT DisplayName, PlayerID FROM Player
                       )
                       USING (PlayerID)
                       WHERE GameID = :game_id
                       AND LeagueID = :league_id
                       ORDER BY Score DESC', game_id, league_id

    return {
      error: true,
      message: "Invalid game ID: #{game_id} or league ID: #{league_id}"
    } if game.empty?

    response = {
      gameID: game.first['GameID'],
      timestamp: game.first['Timestamp'],
      teams: []
    }

    game.each do |player|
      i = response[:teams].index { |t| t[:score] == player['Score'] }
      if i
        # team exists in hash
        response[:teams][i][:players] << {
          playerID: player['PlayerID'],
          displayName: player['DisplayName']
        }
      else
        # team doesn't exist in hash
        response[:teams] << {
          players: [{
            playerID: player['PlayerID'],
            displayName: player['DisplayName']
          }],
          score: player['Score'],
          delta: elo_change(player['PlayerID'], game_id, league_id)
        }
      end
    end

    return response
  end
end

# returns an api object for player with id player_id
def api_player(player_id, extended, league_id)
  database do |db|
    db.results_as_hash = true
    player = db.get_first_row('SELECT * FROM Player
                               WHERE PlayerID = :player_id
                               AND LeagueID = :league_id', player_id, league_id)

    return {
      error: true,
      message: "Invalid player ID: #{player_id} or league ID: #{league_id}"
    } if player.nil?

    win_rate = if player['GamesPlayed'] == 0
                 0
               else
                 player['GamesWon'] / player['GamesPlayed'].to_f
               end

    player = {
      playerID: player['PlayerID'],
      displayName: player['DisplayName'],
      slackName: player['SlackName'],
      elo: player['Elo'],
      winRate: win_rate,
      gamesPlayed: player['GamesPlayed'],
      dailyChange: daily_elo_change(player['PlayerID'], league_id),
      admin: player['Admin'] == 1,
      active: player['Active'] == 1
    }

    player.merge! extended_stats(player_id, league_id) if extended

    return player
  end
end

# returns an api object for player elo history
def api_stats_elo(player_id, limit, league_id)
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
                        LIMIT :limit', player_id, league_id, limit

    return games.collect do |game|
      {
        gameID: game['GameID'],
        timestamp: game['Timestamp'],
        elo: game['Elo']
      }
    end
  end
end

def api_league(league_name)
  database do |db|
    db.results_as_hash = true
    league = db.get_first_row 'SELECT * FROM League
                               WHERE LeagueName = :league_name', league_name

    return {
      error: true,
      message: "Invalid league name: #{league_name}"
    } if league.nil?

    return {
      error: false,
      leagueID: league['LeagueID'],
      leagueName: league_name
    }
  end
end

namespace '/v1' do
  namespace '/:league_id' do
    # Player Information
    # All Players / Multiple Players
    get '/players' do
      # set ids to params, or all player ids
      ids = params['ids'].split ',' if params['ids']
      ids ||= player_ids params['league_id'].to_i
      json ids.collect { |id| api_player(id, false, params['league_id'].to_i) }
    end

    # One Player
    get '/players/:id' do
      id = params['id'].to_i
      json api_player(id, true, params['league_id'].to_i)
    end

    # Game Information
    # Games a Player Has Played In
    get '/players/:id/games' do
      id = params['id'].to_i
      limit = params['limit'].to_i if params['limit']
      ids = games_with_player(id, params['league_id'].to_i)
      limit ||= ids.length

      ids = ids[0, limit]

      json ids.collect { |i| api_game(i, params['league_id'].to_i) }
    end

    # Badges
    # All Badges
    get '/badges' do
      json badges params['league_id'].to_i
    end

    # All Games / Multiple Games
    get '/games' do
      # set params and their defaults1
      ids = params['ids'].split ',' if params['ids']
      limit = params['limit'].to_i if params['limit']
      offset = params['offset'].to_i if params['offset']
      ids ||= game_ids params['league_id'].to_i
      limit ||= ids.length
      offset ||= 0

      ids = ids[offset, limit]
      # fix if offset is too high, return empty array
      ids ||= []

      json ids.collect { |id| api_game(id, params['league_id'].to_i) }
    end

    # One Game
    get '/games/:id' do
      id = params['id'].to_i
      json api_game(id, params['league_id'].to_i)
    end

    # Statistics
    # Player Elo History
    get '/stats/elo/:id' do
      id = params['id'].to_i
      limit = params['limit'].to_i if params['limit']
      limit ||= 30
      json api_stats_elo(id, limit, params['league_id'].to_i)
    end

    # Players Elo History
    get '/stats/elo' do
      ids = params['ids'].split ',' if params['ids']
      ids ||= player_ids params['league_id'].to_i
      limit = params['limit'].to_i if params['limit']
      limit ||= 30

      json(ids.collect do |id|
        {
          playerID: id,
          elos: api_stats_elo(id, limit, params['league_id'].to_i)
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

      info = add_game(outcome, params['league_id'].to_i, body['timestamp'])

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

      add_player(params['league_id'].to_i, body['displayName'], body['slackName'], admin, active)

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

      unless valid_game?(id, params['league_id'].to_i)
        return json(
          error: true,
          message: 'Invalid game ID: #{id}'
        )
      end

      outcome = {}
      body['teams'].each do |team|
        team['players'].each { |p| outcome[p] = team['score'] }
      end

      edit_game(params['league_id'].to_i, id, outcome, body['timestamp'])

      json(
        error: false,
        message: 'Game updated.'
      )
    end

    # Edit Player
    put '/players/:id' do
      id = params['id'].to_i
      body = JSON.parse request.body.read

      unless valid_player?(id, params['league_id'].to_i)
        return json(
          error: true,
          message: 'Invalid player ID: #{id}'
        )
      end

      edit_player(params['league_id'].to_i, id, body['displayName'], body['slackName'],
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

      unless valid_game?(id, params['league_id'].to_i)
        return json(
          error: true,
          message: 'Invalid game ID: #{id}'
        )
      end

      remove_game(id, params['league_id'].to_i)

      json(
        error: false,
        message: 'Game removed.'
      )
    end

    post '/recalc' do
      recalc(params['league_id'].to_i, 0, false)

      json(
        error: false,
        message: 'Stats recalculated.'
      )
    end
  end

  # League lookup
  get '/leagues/:name' do
    league_name = params['name']
    json api_league league_name
  end

  # add a new league
  post '/leagues' do
    body = JSON.parse request.body.read

    add_league(body['leagueName'])

    json(
      error: false,
      message: 'League added.'
    )
  end
end
