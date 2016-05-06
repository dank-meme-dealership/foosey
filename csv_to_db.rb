#!/usr/bin/env ruby
# converts old shitty foosey csv to new less shitty foosey sqlite db

require 'sqlite3'

contents = File.read('games.csv')
system 'sqlite3 foosey.db < InitializeDatabase.sqlite'
db = SQLite3::Database.new 'foosey.db'

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
