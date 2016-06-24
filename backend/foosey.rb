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
  set :allow_methods, [:get, :post, :options, :delete, :put]
  set :show_exceptions, false
end

# load other foosey files and enable auto-reload
script_dir = File.dirname(__FILE__).to_s
load "#{script_dir}/foosey_def.rb"
load "#{script_dir}/foosey_slack.rb"
load "#{script_dir}/foosey_api.rb"
also_reload "#{script_dir}/foosey_def.rb"
also_reload "#{script_dir}/foosey_slack.rb"
also_reload "#{script_dir}/foosey_api.rb"

recalc(1, 0, false) if ARGV.include? 'recalc'

get '/' do
  redirect 'https://github.com/brikr/foosey/blob/master/API.md'
end

get '/foosey.db' do
  return File.read('foosey.db')
end

# options workaround as defined in sinatra-cross_origin gem
options '*' do
  response.headers['Allow'] = 'HEAD,GET,PUT,POST,DELETE,OPTIONS'

  response.headers['Access-Control-Allow-Headers'] =
    'X-Requested-With, X-HTTP-Method-Override, ' \
    'Content-Type, Cache-Control, Accept'

  200
end
