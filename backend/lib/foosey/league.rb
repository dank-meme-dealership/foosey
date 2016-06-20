module Foosey
  class League
    def initialize(id = 1)
      @id = id
    end

    def id
      @id
    end

    def players
      @players ||= Foosey.database do |db|
        db.execute('SELECT PlayerID FROM Player
                    WHERE LeagueID = :league_id
                    ORDER BY PlayerID',
                   id).flatten
      end
    end

    def games
      @games ||= Foosey.database do |db|
        db.execute('SELECT GameID FROM Game
                    WHERE LeagueID = :league_id
                    ORDER BY Timestamp',
                   id).flatten
      end
    end
  end
end
