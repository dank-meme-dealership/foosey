module Foosey
  class League < Foosey::Cacheable
    def initialize(id = 1)
      @id = id
    end

    attr_reader :id

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
        db.execute('SELECT DISTINCT GameID FROM Game
                    WHERE LeagueID = :league_id
                    ORDER BY Timestamp DESC',
                   id).flatten
      end
    end
  end
end
