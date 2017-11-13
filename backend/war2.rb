#!/usr/bin/env ruby
# adds a new team from soccer scores to test our API

require 'json'
require 'date'
require 'net/http'

$stdout.sync = true
script_dir = File.dirname(__FILE__).to_s
load "#{script_dir}/foosey.rb"


league_name = 'warcraft2'
display_name = 'Warcraft 2'

print 'Adding league... '
if api_league(league_name)[:error]
  add_league(league_name, display_name)
  puts 'done'
else
  puts 'already exists'
end
league_id = api_league(league_name)[:leagueID]

total_games = 0
total_players = 0

puts 'Starting parsing data'

# parse json
players = JSON.parse(File.read('war2_players.json'))
games = JSON.parse(File.read('war2_singles.json'))

# add players
new_players = 0
existing_players = 0
players.each do |player|
  if player_exists?(player, league_id)
    existing_players += 1
  else
    new_players += 1
    add_player(league_id, player, '', true, true)
  end
  print "Adding #{players.length} players... #{existing_players} existing players, #{new_players} new players\r"
  $stdout.flush
end
total_players += new_players
print "\n"

# add games
added_games = 0
skipped_games = 0
games.each do |game|
  if game['teamScore1'] == game['teamScore2']
    skipped_games += 1
  else
    added_games += 1
    outcome = {}

    p1 = game['p1']['_id'].split(//).last(8).join
    p2 = game['p2']['_id'].split(//).last(8).join
    p3 = game['p3']['_id'].split(//).last(8).join if game['p3']
    p4 = game['p4']['_id'].split(//).last(8).join if game['p4']

    # if there's a third player, it's a 2v2
    if game['p3']
      outcome[id(p1, league_id)] = game['teamScore1']
      outcome[id(p2, league_id)] = game['teamScore1']
      outcome[id(p3, league_id)] = game['teamScore2']
      outcome[id(p4, league_id)] = game['teamScore2']
    else # 1v1
      outcome[id(p1, league_id)] = game['teamScore1']
      outcome[id(p2, league_id)] = game['teamScore2']
    end
    timestamp = DateTime.rfc3339(game['ctime']).to_time.to_i

    unless outcome.all? {|k, v| !v.nil? && !k.nil?}
      # puts "SKIP: Game: #{added_games + skipped_games} id: #{game['_id']} p1: #{p1} p2: #{p2} p3: #{p3} p4: #{p4}"
      added_games -= 1
      skipped_games += 1
      next
    end

    # puts "CONT: Game: #{added_games} id: #{game['_id']} p1: #{p1} p2: #{p2} p3: #{p3} p4: #{p4}"

    add_game(outcome, league_id, timestamp)
  end
  print "Adding #{games.length} games... #{skipped_games} games skipped, #{added_games} games added\r"
  $stdout.flush
end
total_games += added_games
print "\n"

# convert player ids to names
names_converted = 0
players.each do |player|
  if player['username'] && player['username'] != ''
    id = player['_id'].split(//).last(8).join
    player_id = id(id, league_id)
    names_converted += 1
    edit_player(league_id, player_id, player['username'])
  end
  print "Converting #{players.length} player ids to names... #{names_converted} names converted\r"
  $stdout.flush
end
print "\n"

"Finished. #{total_players} players and #{total_games} games added"

