module Foosey
  class Game
    def initialize(id)
      @id = id
    end

    def id
      @id
    end

    def players
      @players ||= Foosey.database do |db|
        db.execute('SELECT PlayerID FROM Game WHERE GameID = :id', id).flatten
      end
    end

    def timestamp
      @timestamp ||= Foosey.database do |db|
        db.execute 'SELECT Timestamp FROM Game WHERE GameID = :id', id
      end
    end

    def score(player_id)
      @scores ||= {}
      @scores[player_id] ||= Foosey.database do |db|
        db.execute 'SELECT Score FROM Game WHERE GameID = :id AND PlayerID = :player_id', id, player_id
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
      @teams ||= Foosey.database do |db|
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
            response[:teams] << {
              players: [{
                playerID: player.id,
                displayName: player.display_name
              }],
              score: score(player_id),
              delta: delta(player_id)
            }
          end
        end
      end
    end

    def winners
      @winners ||= Foosey.database do |db|
        winner = db.execute('SELECT PlayerID FROM Game
                             WHERE GameID = :id
                             AND Score = (
                               SELECT MAX(Score) FROM Game
                               WHERE GameID = :game_id
                               GROUP BY GameID
                             )', id).flatten

        winner = winner.first if winner.length == 1

        # return the winner(s)
        return winner
      end
    end

    def losers
      @losers ||= Foosey.database do |db|
        loser = db.execute('SELECT PlayerID FROM Game
                            WHERE GameID = :id
                            AND Score = (
                              SELECT MIN(Score) FROM Game
                              WHERE GameID = :game_id
                              GROUP BY GameID
                            )', id).flatten

        loser = loser.first if loser.length == 1

        # return the winner(s)
        return loser
      end
    end

    def singles?
      @singles ||= players.length == 2
    end

    def doubles?
      @doubles ||= players.length == 4
    end

    def to_h
      @h ||= Foosey.database do |db|
        db.results_as_hash = true
        game = db.execute 'SELECT * FROM Game
                           JOIN (
                             SELECT DisplayName, PlayerID FROM Player
                           )
                           USING (PlayerID)
                           WHERE GameID = :id
                           ORDER BY Score DESC', id

        {
          gameID: id,
          timestamp: timestamp,
          teams: teams
        }
      end
    end
  end
end
