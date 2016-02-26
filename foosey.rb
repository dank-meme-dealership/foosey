#!/usr/bin/env ruby

require 'json'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'
require 'sinatra/reloader'
require 'sqlite3'

# initialize the foosey database if it doesn't exist
unless File.exist?('foosey.db')
  begin
    sql = File.read('InitializeDatabase.sqlite')
    db = SQLite3::Database.new 'foosey.db'
    db.execute_batch sql
  rescue SQLite3::Exception => e
    puts e
  ensure
    db.close if db
  end
end

# FOOS
set :port, 4005

configure do
  enable :cross_origin
end

# load other foosey files and enable auto-reload
load 'foosey_def.rb'
load 'foosey_slack.rb'
load 'foosey_api.rb'
also_reload 'foosey_def.rb'
also_reload 'foosey_slack.rb'
also_reload 'foosey_api.rb'

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
