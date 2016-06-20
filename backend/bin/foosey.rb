#!/usr/bin/env ruby

$LOAD_PATH.unshift(File.dirname(File.realpath(__FILE__)) + '/../lib')
require 'foosey'

puts Foosey::Player.new(2).to_h(true)

module Foosey
  class API
    # run! if __FILE__ == $0
  end
end
