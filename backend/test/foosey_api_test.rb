#!/usr/bin/env rspec

require_relative '../bin/foosey.rb'
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
    Foosey::API
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

    it 'get badges' do
      get '/v1/badges'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_at_least(1).players
      expect(last_response.jbody[0]).to have_key('badges')
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

    it 'get elo history' do
      get '/v1/stats/elo'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_at_least(2).players
    end

    it 'get elo history for player' do
      get '/v1/stats/elo/2'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_at_least(5).games
    end
  end

  describe 'Mutators' do
    after(:each) do
      FileUtils.cp("#{File.dirname(__FILE__)}/foosey.db.pristine",
                   "#{File.dirname(__FILE__)}/foosey.db")
    end

    it 'add new game' do
      post '/v1/games', {
        timestamp: 1_465_916_565,
        teams: [
          {
            players: [1, 2],
            score: 5
          },
          {
            players: [3, 4],
            score: 3
          }
        ]
      }.to_json
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_key('info')
      expect(last_response.jbody['info']).to have_key('gameID')
      game_id = last_response.jbody['info']['gameID']

      get "/v1/games/#{game_id}"
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('timestamp' => 1_465_916_565)
    end

    it 'edit existing game' do
      put '/v1/games/2', {
        teams: [
          {
            players: [1],
            score: 5
          },
          {
            players: [2],
            score: 4
          }
        ]
      }.to_json
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => false)

      get '/v1/games/2'
      expect(last_response).to be_ok
      expect(last_response.jbody).to have_key('teams')
      expect(last_response.jbody['teams']).to have(2).teams
      expect(last_response.jbody['teams'][0]).to include('score' => 5)
    end

    it 'edit nonexistent game' do
      put '/v1/games/99999', {
        teams: [
          {
            players: [1],
            score: 5
          },
          {
            players: [2],
            score: 4
          }
        ]
      }.to_json
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => true)
    end

    it 'add new player' do
      post '/v1/players', {
        displayName: 'Testo',
        slackName: 'testo',
        admin: true,
        active: false
      }.to_json
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => false)
    end

    it 'edit existing player' do
      put '/v1/players/2', {
        displayName: 'New Brik'
      }.to_json
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => false)

      get '/v1/players/2'
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('displayName' => 'New Brik')
    end

    it 'edit nonexistent player' do
      put '/v1/players/0', {
        displayName: 'Nono'
      }.to_json
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => true)
    end

    it 'remove existing game' do
      delete '/v1/games/2'
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => false)

      get '/v1/games/2'
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => true)
    end

    it 'remove nonexistent game' do
      delete '/v1/games/99999'
      expect(last_response).to be_ok
      expect(last_response.jbody).to include('error' => true)
    end
  end
end
