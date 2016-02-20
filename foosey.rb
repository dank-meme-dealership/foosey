#!/usr/bin/env ruby

require 'inifile'
require 'json'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'

# Only put stuff in here that should *not* be reloaded when running foosey update
# The smaller the file is, the less manual foosey restarts will be necessary

# fuck off
$middle = %{```....................../´¯/)
....................,/¯../
.................../..../
............./´¯/'...'/´¯¯`·¸
........../'/.../..../......./¨¯\\
........('(...´...´.... ¯~/'...')
.........\\.................'...../
..........''...\\.......... _.·´
............\\..............(
..............\\.............\\...```}

$UTC = '-07:00'

$names = []

ini = IniFile.load('foosey.ini')

$admins = ini['settings']['admins'].split(',')
$ignore = ini['settings']['ignore'].split(',')
$app_dir = ini['settings']['app_dir']
# slackurl contains the url that you can send HTTP POST to to send messages
$slack_url = ini['settings']['slack_url']

# pull and load
# hot hot hot deploys
# there's probably a git gem we could use here
def update
  system "cd #{$app_dir} && git pull" if $app_dir
  system "cd #{File.dirname(__FILE__)} && git pull"
  load 'foosey_def.rb'
end

load 'foosey_def.rb'

# FOOS
set :port, 4005

configure do
  enable :cross_origin
end

post '/slack' do
  json log_game_from_slack(params['user_name'], params['text'], params['trigger_word'])
end

options '/app' do
  200
end

post '/app' do
  # parse json from angular
  params = JSON.parse(request.body.read)
  json log_game_from_app(params['user_name'], params['text'])
end

get '/games.csv' do
  return File.read('games.csv')
end
