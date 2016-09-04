module Foosey
  class Game < Foosey::Cacheable
    attr_reader :id

    def initialize(id)
      @id = id
    end

    def players
      @players ||= Foosey.database do |db|
        players = db.execute('SELECT PlayerID FROM Game WHERE GameID = :id', id).flatten
        # don't cache if players is empty
        players.empty? ? nil : players
      end
    end

    def timestamp
      @timestamp ||= Foosey.database do |db|
        db.get_first_value 'SELECT Timestamp FROM Game WHERE GameID = :id', id
      end
    end

    def score(player_id)
      @scores ||= {}
      @scores[player_id] ||= Foosey.database do |db|
        db.get_first_value 'SELECT Score FROM Game WHERE GameID = :id AND PlayerID = :player_id', id, player_id
      end
    end

    def delta(player_id)
      @deltas ||= {}
      @deltas[player_id] ||= Foosey.database do |db|
        elos = db.execute('SELECT e.Elo FROM EloHistory e
                           JOIN Game g
                           USING (GameID, PlayerID)
                           WHERE e.PlayerID = :player_id
                           AND g.Timestamp <= :timestamp
                           ORDER BY g.Timestamp DESC
                           LIMIT 2',
                          player_id, timestamp).flatten

        # safety if player doesn't have any games
        break 0 if elos.empty?
        # safety if there is only one game, so we should delta from 1200
        break elos.first - 1200 if elos.length == 1

        elos.first - elos.last
      end
    end

    # array of hashes, each containing array of members (id/name) and team score
    def teams
      @teams ||= begin
        rval = []
        players.each do |player_id|
          player = Player.new player_id
          i = rval.index { |t| t[:score] == score(player_id) }
          if i
            # team exists in hash
            rval[i][:players] << {
              playerID: player.id,
              displayName: player.display_name
            }
          else
            # team doesn't exist in hash
            rval << {
              players: [{
                playerID: player.id,
                displayName: player.display_name
              }],
              score: score(player_id),
              delta: delta(player_id)
            }
          end
        end
        rval
      end
    end

    def winners
      @winners ||= Foosey.database do |db|
        db.execute('SELECT PlayerID FROM Game
                    WHERE GameID = :id
                    AND Score = (
                      SELECT MAX(Score) FROM Game
                      WHERE GameID = :id
                      GROUP BY GameID
                    )', id).flatten
      end
    end

    def losers
      @losers ||= Foosey.database do |db|
        db.execute('SELECT PlayerID FROM Game
                    WHERE GameID = :id
                    AND Score = (
                      SELECT MIN(Score) FROM Game
                      WHERE GameID = :id
                      GROUP BY GameID
                    )', id).flatten
      end
    end

    def singles?
      @singles ||= players.length == 2
    end

    def doubles?
      @doubles ||= players.length == 4
    end

    def to_h
      {
        gameID: id,
        timestamp: timestamp,
        teams: teams
      }
    end

    # set the properties of this game via an info hash
    # this will replace all existing records in the database with regards to this game!
    # the info hash must contain the following keys:
    # timestamp: game time
    # league_id: league ID
    # outcome: key/value pairs of player_id/score
    def info=(info)
      # get old timestamp and players involved for caching/recalc
      old_timestamp = timestamp || info[:timestamp]
      old_players = players || []

      Foosey.database do |db|
        db.transaction
        # remove existing data for game
        db.execute 'DELETE FROM Game WHERE GameID = :id', id

        info[:outcome].each do |player_id, score|
          db.execute 'INSERT INTO Game VALUES (:id, :player_id, :league_id, :score, :timestamp)',
                     id, player_id, info[:league_id], score, info[:timestamp]
        end

        db.commit

        Foosey.recalc(old_timestamp)

        # remove this game from cache
        invalidate

        # removed involved players from the cache
        old_players.each { |p| Player.new(p).invalidate }
        info[:outcome].each { |player_id, _score| Player.new(player_id).invalidate }
      end
    end

    # add a game to the database and update the history tables
    # outcome is hash containing key/value pairs where
    # key = player id
    # value = score
    def self.create(outcome, league_id = 1, timestamp = nil)
      id = Foosey.database do |db|
        1 + (db.get_first_value('SELECT GameID FROM Game ORDER BY GameID DESC LIMIT 1') || 0)
      end
      timestamp ||= Time.now.to_i

      game = Game.new(id)
      game.info = {
        league_id: league_id,
        timestamp: timestamp,
        outcome: outcome
      }

      # HACK: the game object we just made has some ill-cached values
      Game.new(id)
    end
  end

  # recalculate elos/elo history for all games after timestamp
  # this does not invalidate affected cached players!
  # methods calling this should handle their own invalidation
  def self.recalc(timestamp = 0, silent = true)
    unless silent
      start = Time.now.to_f
      puts 'Calculating Elo'
    end
    recalc_elo timestamp
    unless silent
      printf("Took %.3f seconds\n", Time.now.to_f - start)
      start = Time.now.to_f
      puts 'Calculating win rate'
    end
    recalc_win_rate
    printf("Took %.3f seconds\n", Time.now.to_f - start) unless silent
  end

  def self.recalc_elo(timestamp = 0, league_id = 1)
    Foosey.database do |db|
      # init transaction for zoom
      db.transaction

      db.execute 'DELETE FROM EloHistory
                  WHERE GameID IN (
                    SELECT GameID FROM Game
                    WHERE Timestamp >= :timestamp
                  )
                  AND LeagueID = :league_id',
                 timestamp, league_id

      win_weight = db.get_first_value 'SELECT Value FROM Config
                                       WHERE Setting = "WinWeight"'
      max_score = db.get_first_value 'SELECT Value FROM Config
                                      WHERE Setting = "MaxScore"'
      k_factor = db.get_first_value 'SELECT Value FROM Config
                                     WHERE Setting = "KFactor"'

      # temporary array of hashes to keep track of player elo
      elos = {}
      player_ids = League.new(league_id).players
      player_ids.each do |player_id|
        elos[player_id] = db.get_first_value('SELECT Elo FROM EloHistory e
                                              JOIN Game g USING (GameID, PlayerID)
                                              WHERE PlayerID = :player_id
                                              AND Timestamp <= :timestamp
                                              ORDER BY Timestamp DESC
                                              LIMIT 1',
                                             player_id, timestamp)

        # in case they had no games before timestamp
        elos[player_id] ||= 1200
      end

      # for each game
      db.execute('SELECT DISTINCT GameID
                  FROM Game
                  WHERE Timestamp >= :timestamp
                  AND LeagueID = :league_id
                  ORDER BY Timestamp',
                 timestamp, league_id) do |game_id|
        game = Foosey.create_query_hash(db.execute2('SELECT PlayerID, Score FROM Game
                                                     WHERE GameID = :game_id
                                                     ORDER BY Score', game_id))

        # calculate the elo change
        case game.length
        when 2
          rating_a = elos[game[0]['PlayerID']]
          rating_b = elos[game[1]['PlayerID']]
          score_a = game[0]['Score']
          score_b = game[1]['Score']
        when 4
          rating_a = ((elos[game[0]['PlayerID']] +
                       elos[game[1]['PlayerID']]) / 2).round
          rating_b = ((elos[game[2]['PlayerID']] +
                       elos[game[3]['PlayerID']]) / 2).round
          score_a = game[0]['Score']
          score_b = game[2]['Score']
        else
          # fuck trips
          next
        end

        delta_a, delta_b = elo_delta(rating_a, score_a, rating_b, score_b,
                                     k_factor, win_weight, max_score)

        # insert into history table
        game.each_with_index do |player, idx|
          case game.length
          when 2
            elos[player['PlayerID']] += idx < 1 ? delta_a : delta_b
          when 4
            elos[player['PlayerID']] += idx < 2 ? delta_a : delta_b
          end
          db.execute 'INSERT INTO EloHistory
                      VALUES (:game_id, :player_id, :league_id, :elo)',
                     game_id, player['PlayerID'], league_id,
                     elos[player['PlayerID']]
        end
      end

      elos.each do |player_id, elo|
        db.execute 'UPDATE Player SET Elo = :elo
                    WHERE PlayerID = :player_id',
                   elo, player_id
      end

      # end transaction
      db.commit
    end
  end

  def self.recalc_win_rate(league_id = 1)
    Foosey.database do |db|
      db.execute('SELECT PlayerID FROM Player WHERE LeagueID = :league_id',
                 league_id) do |player_id|
        db.execute('UPDATE Player SET GamesPlayed = (
                      SELECT COUNT(*) FROM Game
                      WHERE PlayerID = :player_id
                      AND LeagueID = :league_id
                    ) WHERE PlayerID = :player_id
                      AND LeagueID = :league_id',
                   player_id, league_id)

        db.execute('UPDATE Player SET GamesWon = (
                      SELECT COUNT(*) FROM Game
                      JOIN (
                        SELECT GameID, MAX(Score) AS Score FROM Game
                        WHERE LeagueID = :league_id
                        GROUP BY GameID
                      )
                      USING (GameID, Score)
                      WHERE PlayerID = :player_id
                      AND LeagueID = :league_id
                    ) WHERE PlayerID = :player_id
                      AND LeagueID = :league_id',
                   league_id, player_id)
      end
    end
  end
end
