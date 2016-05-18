#!/usr/bin/env ruby
# converts old shitty foosey csv to new less shitty foosey sqlite db

require 'sqlite3'

load 'foosey_def.rb'

contents = File.read('games.csv')
system 'sqlite3 foosey.db < InitializeDatabase.sqlite'

database do |db|
  db.transaction

  names = contents.lines.first.strip.split(',')[2..-1]
  games = contents.lines[1..-1]

  names.each do |name|
    db.execute 'INSERT INTO Player (DisplayName)
                VALUES (:name)', name.capitalize
  end

  games.each_with_index do |ge, game_id|
    game = ge.split(',')
    timestamp = game.shift
    game.shift # ignore who
    game.each_with_index do |g, idx|
      next if g.strip == '-1'
      player_id = idx + 1
      score = g.strip.to_i
      db.execute 'INSERT INTO Game (GameID, PlayerID, Score, Timestamp)
                  VALUES (:game_id, :player_id, :score, :timestamp)',
                 game_id, player_id, score, timestamp
    end
  end

  # set brik and matt to admin
  db.execute 'UPDATE Player SET Admin = 1
              WHERE PlayerID IN (1, 2)'

  # set brik and matt slack names
  db.execute 'UPDATE Player SET SlackName = "matttt"
              WHERE PlayerID = 1'
  db.execute 'UPDATE Player SET SlackName = "brik"
              WHERE PlayerID = 2'

  db.commit

  recalc
end
