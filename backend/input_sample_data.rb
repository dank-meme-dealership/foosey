#!/usr/bin/env ruby
# adds a new team from soccer scores to test our API

require 'json'
require 'date'
require 'fileutils'

# Remove all json files if they already exist
FileUtils.rm Dir.glob('*.json')

$stdout.sync = true
script_dir = File.dirname(__FILE__).to_s
load "#{script_dir}/foosey.rb"
league_name = 'soccer'

print 'Fetching seasons... '
`wget http://api.football-data.org/v1/soccerseasons -O seasons.json >/dev/null 2>&1`
puts 'done'

print 'Adding league... '
if api_league(league_name)[:error]
  add_league(league_name)
  puts 'done'
else
  puts 'already exists'
end
league_id = api_league(league_name)[:leagueID]

seasons = JSON.parse(File.read('seasons.json'))

total_games = 0
total_players = 0

seasons.each do |season|
  puts "Starting season #{season['id']}"

  `wget http://api.football-data.org/v1/soccerseasons/#{season['id']}/teams -O players.json >/dev/null 2>&1`
  `wget http://api.football-data.org/v1/soccerseasons/#{season['id']}/fixtures -O games.json >/dev/null 2>&1`

  players = JSON.parse(File.read('players.json'))
  games = JSON.parse(File.read('games.json'))

  print "Adding #{players['count']} players... "
  new_players = 0
  existing_players = 0
  players['teams'].each do |player|
    if player_exists?(player['name'], league_id)
      existing_players += 1
    else
      new_players += 1
      add_player(league_id, player['name'], '', true, true)
    end
  end
  total_players += new_players
  puts 'done' if existing_players == 0
  puts "#{existing_players} existing players, #{new_players} new players" if existing_players > 0

  print "Adding #{games['count']} games... "
  games['fixtures'].each do |game|
    next if game['result']['goalsHomeTeam'] == game['result']['goalsAwayTeam']
    timestamp = DateTime.rfc3339(game['date']).to_time.to_i
    outcome = {}
    outcome[id(game['homeTeamName'], league_id)] = game['result']['goalsHomeTeam']
    outcome[id(game['awayTeamName'], league_id)] = game['result']['goalsAwayTeam']
    add_game(outcome, league_id, timestamp)
  end
  total_games += games['count']
  puts 'done'

  # Remove files when we're done
  FileUtils.rm Dir.glob('game.json')
  FileUtils.rm Dir.glob('players.json')

  puts "Done with season #{season['id']}"
end

puts "Finished all seasons. #{total_players} players and #{total_games} games added"

# goodbye seasons
FileUtils.rm Dir.glob('seasons.json')
