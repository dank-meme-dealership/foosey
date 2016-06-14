#!/bin/bash
# Requires wget `brew install wget`

cd "$( dirname "${BASH_SOURCE[0]}" )"

rm -f foosey.db games.csv

wget api.foosey.futbol/games.csv

./csv_to_db.rb

rm -f games.csv
