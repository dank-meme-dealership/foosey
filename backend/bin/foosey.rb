#!/usr/bin/env ruby

$LOAD_PATH.unshift(File.dirname(File.realpath(__FILE__)) + '/../lib')
require 'foosey'

module Foosey
  class API
    run! if __FILE__ == $PROGRAM_NAME
  end
end
