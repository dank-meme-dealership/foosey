#!/usr/bin/env ruby

require 'json'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'
require 'sqlite3'

# Only put stuff in here that should not be reloaded when running foosey update
# The smaller the file is, the less manual foosey restarts will be necessary

# pull and load
# hot hot hot deploys
def update
  app_dir = get_app_dir
  # there's probably a git gem we could use here
  system "cd #{app_dir} && git pull" unless app_dir.empty?
  system "cd #{File.dirname(__FILE__)} && git pull"
  load 'foosey_def.rb'
end

# load the initial foosey functions
load 'foosey_def.rb'

# initialize the foosey database if it doesn't exist
unless File.exist?('foosey.db')
  system 'sqlite3 foosey.db < InitializeDatabase.sqlite'
end

# FOOS
set :port, 4005

configure do
  enable :cross_origin
end

post '/slack' do
  json slack(params['user_name'], params['text'], params['trigger_word'])
end

options '/app' do
  200
end

post '/app' do
  # parse json from angular
  params = JSON.parse(request.body.read)
  json log_game_from_app(params['user_name'], params['text'])
end

get '/foosey.db' do
  return File.read('foosey.db')
end
