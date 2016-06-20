module Foosey
  class Player
    def initialize(id)
      @id = id
    end

    def id
      @id
    end

    def league_id
      @league_id ||= Foosey.database do |db|
        db.get_first_value 'SELECT LeagueID FROM Player WHERE PlayerID = :id', id
      end
    end

    def display_name
      @display_name ||= Foosey.database do |db|
        db.get_first_value 'SELECT DisplayName FROM Player WHERE PlayerID = :id', id
      end
    end

    def slack_name
      @slack_name ||= Foosey.database do |db|
        db.get_first_value 'SELECT SlackName FROM Player WHERE PlayerID = :id', id
      end
    end

    def admin?
      @admin ||= Foosey.database do |db|
        db.get_first_value('SELECT Admin FROM Player WHERE PlayerID = :id', id) == 1
      end
    end

    def active?
      @active ||= Foosey.database do |db|
        db.get_first_value('SELECT Active FROM Player WHERE PlayerID = :id', id) == 1
      end
    end

    def elo
      @elo ||= Foosey.database do |db|
        db.get_first_value 'SELECT Elo FROM Player WHERE PlayerID = :id', id
      end
    end

    def games_played
      @games_played ||= Foosey.database do |db|
        db.get_first_value 'SELECT GamesPlayed FROM Player WHERE PlayerID = :id', id
      end
    end

    def games_won
      @games_won ||= Foosey.database do |db|
        db.get_first_value 'SELECT GamesWon FROM Player WHERE PlayerID = :id', id
      end
    end

    def games
      @games ||= Foosey.database do |db|
        db.execute('SELECT DISTINCT GameID FROM Game WHERE PlayerID = :id', id)
      end
    end

    def daily_elo_change
      @daily_elo_change ||= Foosey.database do |db|
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
      @extended_stats ||= Foosey.database do |db|
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

        ally = allies.max_by { |_k, v| v } || ['Nobody', 0]
        nemesis = nemeses.max_by { |_k, v| v } || ['Nobody', 0]
        doubles_win_rate = doubles_wins / doubles_games.to_f
        singles_win_rate = singles_wins / singles_games.to_f
        return {
          ally: Player.new(ally[0]).display_name,
          allyCount: ally[1],
          doublesWinRate: doubles_win_rate.nan? ? nil : doubles_win_rate,
          doublesTotal: doubles_games,
          nemesis: Player.new(nemesis[0]).display_name,
          nemesisCount: nemesis[1],
          singlesWinRate: singles_win_rate.nan? ? nil : singles_win_rate,
          singlesTotal: singles_games
        }
      end
    end

    def to_h(extended = false)
      @h ||= begin

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
