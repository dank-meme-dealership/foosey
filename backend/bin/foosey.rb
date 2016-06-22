#!/usr/bin/env ruby

$LOAD_PATH.unshift(File.dirname(File.realpath(__FILE__)) + '/../lib')
require 'foosey'

puts Foosey::Game.new(2).to_h
Foosey::Game.new

module Foosey
  class API
    # run! if __FILE__ == $PROGRAM_NAME
  end
end
