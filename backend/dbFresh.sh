#!/bin/bash
# Requires wget `brew install wget`

cd "$( dirname "${BASH_SOURCE[0]}" )"

rm -f foosey.db

wget http://api.foosey.futbol/foosey.db
