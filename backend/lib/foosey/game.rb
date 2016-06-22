module Foosey
  class Game < Foosey::Cacheable
    attr_reader :id

    def initialize(id)
      @id = id
    end

    def players
      @players ||= Foosey.database do |db|
        db.execute('SELECT PlayerID FROM Game WHERE GameID = :id', id).flatten
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
      @h ||= {
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
      Foosey.database do |db|
        db.transaction
        # remove existing data for game
        db.execute 'DELETE FROM Game WHERE GameID = :id', id

        info[:outcome].each do |player_id, score|
          db.execute 'INSERT INTO Game VALUES (:id, :player_id, :league_id, :score, :timestamp)',
                     id, player_id, info[:league_id], score, info[:timestamp]
        end

        db.commit

        Foosey.recalc(info[:timestamp])

        # remove this game from cache
        invalidate
      end
    end

    # add a game to the database and update the history tables
    # outcome is hash containing key/value pairs where
    # key = player id
    # value = score
    def create(outcome, league_id = 1, timestamp = nil)
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

      game
    end
  end

  # recalculate elos/elo history for all games after timestamp
  def self.recalc(_timestamp = 0, _silent = true)
  end
end
