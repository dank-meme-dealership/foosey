#!/bin/bash

cd `dirname "${BASH_SOURCE[0]}"`

sleep 5

git pull

pkill -f foosey.rb

sleep 5

nohup ruby foosey.rb recalc &

exit 0
