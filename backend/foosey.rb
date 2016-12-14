#!/usr/bin/env ruby

require 'json'
require 'net/http'
require 'sinatra'
require 'sinatra/cross_origin'
require 'sinatra/json'
require 'sinatra/namespace'
require 'sinatra/reloader'
require 'sqlite3'

# initialize the foosey database if it doesn't exist
unless File.exist?('foosey.db')
  begin
    sql = File.read('InitializeDatabase.sqlite')
    database = SQLite3::Database.new 'foosey.db'
    database.execute_batch sql
  rescue SQLite3::Exception => e
    puts e
  ensure
    database.close if database
  end
end

# FOOS
set :port, 4005

# who the fuck took this line out of the CORS plugin
register Sinatra::CrossOrigin

configure do
  enable :cross_origin
  set :allow_methods, [:get, :post, :options, :delete, :put]
  set :show_exceptions, false
end

# load other foosey files and enable auto-reload
script_dir = File.dirname(__FILE__).to_s
load "#{script_dir}/foosey_def.rb"
load "#{script_dir}/foosey_slack.rb"
load "#{script_dir}/foosey_api.rb"
load "#{script_dir}/input_tsheets_data.rb"
also_reload "#{script_dir}/foosey_def.rb"
also_reload "#{script_dir}/foosey_slack.rb"
also_reload "#{script_dir}/foosey_api.rb"
also_reload "#{script_dir}/input_tsheets_data.rb"

if ARGV.include? 'recalc'
  database do |db|
    db.execute('SELECT LeagueID FROM League').each do |id|
      recalc(id, 0, false)
    end
  end
end

get '/' do
  redirect 'https://github.com/brikr/foosey/blob/master/API.md'
end

get '/foosey.db' do
  return File.read('foosey.db')
end

get '/android' do
  return send_file 'foosey.apk', type: :apk, filename: 'foosey.apk'
end

get '/tsheetsfoos' do
  return json(message: add_tsheets)
end

# options workaround as defined in sinatra-cross_origin gem
options '*' do
  response.headers['Allow'] = 'HEAD,GET,PUT,POST,DELETE,OPTIONS'

  response.headers['Access-Control-Allow-Headers'] =
    'X-Requested-With, X-HTTP-Method-Override, ' \
    'Content-Type, Cache-Control, Accept'

  200
end
