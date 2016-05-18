# foosey API calls
# for more information see API.md

# returns an api object for game with id game_id
def api_game(game_id)
  database do |db|
    db.results_as_hash = true
    game = db.execute 'SELECT * FROM Game
                       JOIN (
                         SELECT DisplayName, PlayerID FROM Player
                       )
                       USING (PlayerID)
                       WHERE GameID = :id
                       ORDER BY Score DESC', game_id

    return {
      error: true,
      message: "Invalid game ID: #{game_id}"
    } if game.nil?

    response = {
      gameID: game.first['GameID'],
      timestamp: game.first['Timestamp'],
      teams: []
    }

    game.each do |player|
      i = response[:teams].index { |t| t[:score] == player['Score'] }
      if i
        # team exists in hash
        response[:teams][i][:players] << player['DisplayName']
      else
        # team doesn't exist in hash
        response[:teams] << {
          players: [player['DisplayName']],
          score: player['Score'],
          delta: elo_change(player['PlayerID'], game_id)
        }
      end
    end

    return response
  end
end

# returns an api object for player with id player_id
def api_player(player_id)
  database do |db|
    db.results_as_hash = true
    player = db.execute('SELECT * FROM Player
                         WHERE PlayerID = :id', player_id).first

    return {
      error: true,
      message: "Invalid player ID: #{player_id}"
    } if player.nil?

    return {
      playerID: player['PlayerID'],
      displayName: player['DisplayName'],
      slackName: player['SlackName'],
      elo: player['Elo'],
      winRate: player['WinRate'],
      gamesPlayed: player['GamesPlayed'],
      dailyChange: daily_elo_change(player['PlayerID']),
      admin: player['Admin'] == 1,
      active: player['Active'] == 1
    }
  end
end

# returns an api object for player elo history
def api_stats_elo(player_id)
  database do |db|
    db.results_as_hash = true
    games = db.execute 'SELECT * FROM EloHistory
                        JOIN (
                          SELECT PlayerID, GameID, Timestamp FROM Game
                        )
                        USING (PlayerID, GameID)
                        WHERE PlayerID = :player_id
                        ORDER BY Timestamp;', player_id

    return games.collect do |game|
      {
        gameID: game['GameID'],
        timestamp: game['Timestamp'],
        elo: game['Elo']
      }
    end
  end
end

namespace '/v1' do
  # Player Information
  # All Players / Multiple Players
  get '/players' do
    # set ids to params, or all player ids
    ids = params['ids'].split ',' if params['ids']
    ids ||= player_ids
    json ids.collect { |id| api_player id }
  end

  # One Player
  get '/players/:id' do
    id = params['id'].to_i
    json api_player id
  end

  # Game Information
  # Games a Player Has Played In
  get '/players/:id/games' do
    id = params['id'].to_i

    ids = games_with_player id

    json ids.collect { |i| api_game i }
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
  post '/add/game' do
    body = JSON.parse request.body.read

    outcome = {}
    body['teams'].each do |team|
      team['players'].each { |p| outcome[p] = team['score'] }
    end

    stats = add_game(outcome, body['timestamp'])

    json(
      error: false,
      message: 'Game added.',
      stats: stats
    )
  end

  # Add Player
  post '/add/player' do
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
  post '/edit/game' do
    body = JSON.parse request.body.read

    outcome = {}
    body['teams'].each do |team|
      team['players'].each { |p| outcome[p] = team['score'] }
    end

    edit_game(body['id'], outcome, body['timestamp'])

    json(
      error: false,
      message: 'Game updated.'
    )
  end

  # Edit Player
  post '/edit/player' do
    body = JSON.parse request.body.read

    edit_player(body['id'], body['displayName'], body['slackName'],
                body['admin'], body['active'])

    json(
      error: false,
      message: 'Player updated.'
    )
  end

  # Removing Objects
  # Remove Game
  delete '/remove/game/:id' do
    id = params['id'].to_i

    remove_game(id)

    json(
      error: false,
      message: 'Game removed.'
    )
  end

  post '/recalc' do
    recalc

    json(
      error: false,
      message: 'Stats recalculated.'
    )
  end
end
