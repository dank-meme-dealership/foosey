#!/usr/bin/env ruby
# adds a new team from soccer scores to test our API

require 'json'
require 'date'
require 'net/http'

def http_get_url(url)
  uri = URI(url)
  req = Net::HTTP::Get.new(uri)
  req['X-Auth-Token'] = '19efe469fe6e4606864d75c8aa4d2256'
  Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
end

$stdout.sync = true
script_dir = File.dirname(__FILE__).to_s
load "#{script_dir}/foosey.rb"

seasons = JSON.parse(http_get_url('http://api.football-data.org/v1/competitions').body)
league_name = 'soccer'

print 'Adding league... '
if api_league(league_name)[:error]
  add_league(league_name)
  puts 'done'
else
  puts 'already exists'
end
league_id = api_league(league_name)[:leagueID]

total_games = 0
total_players = 0

seasons.each do |season|
  puts "Starting season #{season['id']}"

  players = JSON.parse(http_get_url("http://api.football-data.org/v1/competitions/#{season['id']}/teams").body)
  new_players = 0
  existing_players = 0
  players['teams'].each do |player|
    if player_exists?(player['name'], league_id)
      existing_players += 1
    else
      new_players += 1
      add_player(league_id, player['name'], '', true, true)
    end
    print "Adding #{players['count']} players... #{existing_players} existing players, #{new_players} new players\r"
    $stdout.flush
  end
  total_players += new_players
  print "\n"

  games = JSON.parse(http_get_url("http://api.football-data.org/v1/competitions/#{season['id']}/fixtures").body)
  added_games = 0
  skipped_games = 0
  games['fixtures'].each do |game|
    if game['status'] != 'FINISHED' || game['result']['goalsHomeTeam'] == game['result']['goalsAwayTeam']
      skipped_games += 1
    else
      added_games += 1
      timestamp = DateTime.rfc3339(game['date']).to_time.to_i
      # puts "#{timestamp} : #{game['date']}"
      outcome = {}
      outcome[id(game['homeTeamName'], league_id)] = game['result']['goalsHomeTeam']
      outcome[id(game['awayTeamName'], league_id)] = game['result']['goalsAwayTeam']
      add_game(outcome, league_id, timestamp)
    end
    print "Adding #{games['count']} games... #{skipped_games} games skipped, #{added_games} games added\r"
    $stdout.flush
  end
  total_games += added_games
  print "\n"

  puts "Done with season #{season['id']}"
end

puts "Finished all seasons. #{total_players} players and #{total_games} games added"
