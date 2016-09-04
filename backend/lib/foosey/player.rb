module Foosey
  class Player < Foosey::Cacheable
    attr_reader :id
    attr_reader :league_id
    attr_reader :display_name
    attr_reader :slack_name
    attr_reader :admin
    attr_reader :active
    attr_reader :elo
    attr_reader :games_played
    attr_reader :games_won

    def initialize(id)
      @id = id

      return unless valid?

      Foosey.database do |db|
        db.results_as_hash = true
        p = db.get_first_row 'SELECT * FROM Player WHERE PlayerID = :id', id
        @league_id = p['LeagueID']
        @display_name = p['DisplayName']
        @slack_name = p['SlackName']
        @admin = p['Admin'] == 1
        @active = p['Active'] == 1
        @elo = p['Elo']
        @games_played = p['GamesPlayed']
        @games_won = p['GamesWon']
        db.results_as_hash = false
      end
    end

    def admin?
      @admin
    end

    def active?
      @active
    end

    def valid?
      Foosey.database do |db|
        db.execute('SELECT * FROM Player WHERE PlayerID = :id', id).empty? ? false : true
      end
    end

    def games
      @games ||= Foosey.database do |db|
        db.execute('SELECT DISTINCT GameID FROM Game WHERE PlayerID = :id', id).flatten
      end
    end

    # not caching this because it changes so often
    def elo_history(games = 30)
      Foosey.database do |db|
        db.results_as_hash = true
        games = db.execute 'SELECT * FROM EloHistory
                            JOIN (
                              SELECT PlayerID, GameID, Timestamp FROM Game
                            )
                            USING (PlayerID, GameID)
                            WHERE PlayerID = :player_id
                            ORDER BY Timestamp DESC
                            LIMIT 30;', id

        games.collect do |game|
          {
            gameID: game['GameID'],
            timestamp: game['Timestamp'],
            elo: game['Elo']
          }
        end
      end
    end

    # not caching this because it changes so often
    def daily_elo_change
      Foosey.database do |db|
        midnight = DateTime.new(Time.now.year, Time.now.month, Time.now.day,
                                0, 0, 0, 0).to_time.to_i
        prev = db.get_first_value('SELECT e.Elo FROM EloHistory e
                                   JOIN Game g
                                   USING (GameID, PlayerID)
                                   WHERE e.PlayerID = :player_id
                                   AND g.Timestamp < :midnight
                                   ORDER BY g.Timestamp DESC
                                   LIMIT 1',
                                  id, midnight)

        today = db.get_first_value('SELECT e.Elo FROM EloHistory e
                                    JOIN Game g
                                    USING (GameID, PlayerID)
                                    WHERE e.PlayerID = :player_id
                                    AND g.Timestamp >= :midnight
                                    ORDER BY g.Timestamp DESC
                                    LIMIT 1',
                                   id, midnight)

        # corner cases
        break 0 unless today
        break today - 1200 unless prev

        today - prev
      end
    end

    def extended_stats
      @extended_stats ||= Foosey.database do |_db|
        allies = Hash.new(0) # key -> player_id, value -> wins
        nemeses = Hash.new(0) # key -> player_id, value -> losses
        singles_games = 0
        singles_wins = 0
        doubles_games = 0
        doubles_wins = 0

        games.each do |game_id|
          game = Game.new game_id

          if game.singles?
            singles_games += 1
            if game.winners.include? id
              # this player won
              singles_wins += 1
            else
              # this player lost
              enemy = game.winners.first
              nemeses[enemy] += 1
            end
          elsif game.doubles?
            doubles_games += 1
            if game.winners.include? id
              # this player won
              doubles_wins += 1
              ally = game.winners.find { |p| p != id }
              allies[ally] += 1
            end
          end
        end

        ally = allies.max_by { |_k, v| v }
        nemesis = nemeses.max_by { |_k, v| v }
        doubles_win_rate = doubles_wins / doubles_games.to_f
        singles_win_rate = singles_wins / singles_games.to_f
        return {
          ally: ally ? Player.new(ally[0]).display_name : 'Nobody',
          allyCount: ally ? ally[1] : 0,
          doublesWinRate: doubles_win_rate.nan? ? nil : doubles_win_rate,
          doublesTotal: doubles_games,
          nemesis: nemesis ? Player.new(nemesis[0]).display_name : 'Nobody',
          nemesisCount: nemesis ? nemesis[1] : 0,
          singlesWinRate: singles_win_rate.nan? ? nil : singles_win_rate,
          singlesTotal: singles_games
        }
      end
    end

    def to_h(extended = false)
      @h ||= begin
        unless valid?
          return {
            error: true,
            message: 'Invalid player ID'
          }
        end

        win_rate = if games_played == 0
                     0
                   else
                     games_won / games_played.to_f
                   end

        player = {
          playerID: id,
          displayName: display_name,
          slackName: slack_name,
          elo: elo,
          winRate: win_rate,
          gamesPlayed: games_played,
          dailyChange: daily_elo_change,
          admin: admin?,
          active: active?
        }

        player.merge! extended_stats if extended

        player
      end
    end
  end
end
