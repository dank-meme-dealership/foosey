module Foosey
  class League < Foosey::Cacheable
    def initialize(id = 1)
      @id = id
    end

    attr_reader :id

    def player_ids
      @player_ids ||= Foosey.database do |db|
        db.execute('SELECT PlayerID FROM Player
                    WHERE LeagueID = :league_id
                    ORDER BY PlayerID',
                   id).flatten
      end
    end

    def players
      @players ||= @player_ids.collect { |id| Player.new(id) }
    end

    def game_ids
      @game_ids ||= Foosey.database do |db|
        db.execute('SELECT DISTINCT GameID FROM Game
                    WHERE LeagueID = :league_id
                    ORDER BY Timestamp DESC',
                   id).flatten
      end
    end

    def games
      @games ||= @game_ids.collect { |id| Game.new(id) }
    end

    # helper method for badge hash
    def badge(emoji, definition)
      {
        emoji: emoji,
        definition: definition
      }
    end

    # this method will probably need a re-write when we refactor how badges work
    # large milkshake...
    # TODO: Create a Badge module with constants for each badge
    # TODO: Create a way to get badges by player inside of player and also be efficient
    # TODO: Historically store badges via the database
    def badges
      return @badges if @badges

      badges = Hash.new { |h, k| h[k] = [] }

      # fire badge
      # best daily change
      best_change = player_ids.group_by(&:daily_elo_change).max
      best_change.last.each { |b| badges[b] << badge('🔥', 'On Fire') } unless best_change.nil? || best_change.first < 10

      # poop badge
      # worst daily change
      worst_change = player_ids.group_by(&:daily_elo_change).min
      worst_change.last.each { |b| badges[b] << badge('💩', 'Rough Day') } unless worst_change.nil? || worst_change.first > -10

      # baby badge
      # 10-15 games played
      babies = players.select do |p|
        p.game_ids.length.between?(10, 15)
      end
      babies.each { |b| badges[b] << badge('👶🏼', 'Newly Ranked') } unless babies.nil? || game_ids.length < 100

      # monkey badge
      # won last game but elo went down
      # flexing badge
      # won last game and gained 10+ elo
      players.select do |p|
        next if p.game_ids
        last_game = Game.new(p.game_ids.last)
        winner = last_game[:teams][0][:players].any? { |a| a[:playerID] == p }
        badges[p] << badge('🙈', 'Monkey\'d') if last_game.winner_ids.include?(p.id) && last_game.delta(p.id) < 0
        badges[p] << badge('🍌', 'Graceful Loss') if last_game.loser_ids.include?(p.id) && last_game.delta(p.id) > 0
        badges[p] << badge('💪🏼', 'Hefty Win') if last_game.winner_ids.include?(p.id) && last_game.delta(p.id) >= 10
        badges[p] << badge('🤕', 'Hospital Bound') if last_game.loser_ids.include?(p.id) && last_game.delta(p.id) <= -10
      end

      # toilet badge
      # last skunk (lost w/ 0 points)
      toilet_game = all_games.find do |g|
        api_game(g, league_id)[:teams][1][:score] == 0
      end
      toilets = api_game(toilet_game, league_id)[:teams][1][:players] if toilet_game
      toilets.each { |b| badges[b[:playerID]] << badge('🚽', 'Get Rekt') } unless toilets.nil?

      # win streak badges
      # 5 and 10 current win streak
      win_streaks = {}
      players.each do |p|
        games = games_with_player(p, league_id)
        last_wins = games.take_while do |g|
          game = api_game(g, league_id)
          game[:teams][0][:players].any? { |a| a[:playerID] == p }
        end
        win_streaks[p] = last_wins.length
      end

      win_streaks.each do |p, s|
        badges[p] << badge("#{s}⃣", "#{s}-Win Streak") if s.between?(3, 9)
        badges[p] << badge('🔟', "#{s}-Win Streak") if s == 10
        badges[p] << badge('💰', "#{s}-Win Streak") if s > 10
      end

      # zzz badge
      # hasn't played a game in 2 weeks
      sleepers = players.select do |p|
        games = games_with_player(p, league_id)
        next if games.length < 10
        last_game = api_game(games.first, league_id)
        Time.now.to_i - last_game[:timestamp] > 1_209_600 # 2 weeks
      end
      sleepers.each { |b| badges[b] << badge('💤', 'Snoozin\'') }

      # nemesis and ally badges
      if player_id > 0
        nemeses = []
        allies = []
        you = api_player(player_id, true, league_id)
        players.each do |p|
          this_player = api_player(p, false, league_id)
          nemeses << p if this_player[:displayName] == you[:nemesis]
          allies << p if this_player[:displayName] == you[:ally]
        end
        nemeses.each { |b| badges[b] << badge('😈', 'Your Nemesis') }
        allies.each { |b| badges[b] << badge('😇', 'Your Ally') }
      end

      # build hash
      @badges = badges.collect do |k, v|
        {
          playerID: k,
          badges: v
        }
      end
    end
  end
end
