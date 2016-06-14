#!/usr/bin/env ruby

require_relative '../foosey.rb'
require 'rack/test'
require 'rspec'
require 'rspec/collection_matchers'

# monkey patch to get a json-parsed body from last_response
module Rack
  class Response
    module Helpers
      def jbody
        JSON.parse body
      end
    end
  end
end

describe 'Foosey API' do
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end

  before(:all) do
    unless File.exist? "#{File.dirname(__FILE__)}/foosey.db"
      raise 'Need pristine database!'
    end

    FileUtils.cp("#{File.dirname(__FILE__)}/foosey.db",
                 "#{File.dirname(__FILE__)}/foosey.db.pristine")
  end

  after(:all) do
    FileUtils.rm("#{File.dirname(__FILE__)}/foosey.db.pristine")
  end

  describe 'Accessors' do
    it 'get players' do
      get '/v1/players'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_at_least(2).players
    end

    it 'get some players' do
      get '/v1/players?ids=2,5,6'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have(3).players
    end

    it 'get valid player' do
      get '/v1/players/2'
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('displayName' => 'Brik')
    end

    it 'get invalid player' do
      get '/v1/players/0'
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => true)
    end

    it 'get games from valid player', slow: true do
      get '/v1/players/2/games'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_at_least(2).games
    end

    it 'get games', slow: true do
      get '/v1/games'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_at_least(2).games
    end

    it 'get some games' do
      get '/v1/games?offset=20&limit=10'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have(10).games
    end

    it 'get valid game' do
      get '/v1/games/10'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_key('timestamp')
    end

    it 'get invalid game' do
      get '/v1/games/99999'
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => true)
    end
  end

  describe 'Mutators' do
    after(:each) do
      FileUtils.cp("#{File.dirname(__FILE__)}/foosey.db.pristine",
                   "#{File.dirname(__FILE__)}/foosey.db")
    end
  end
end
