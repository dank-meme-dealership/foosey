# foosey
The ultimate all-in-one foosball ranking Slack Bot

## Forward
This bot has some work to be done before it's useful to anyone other than the individuals at WhiteCloud Analytics. Stay tuned!

## Hot Deploys
`foosey` utilizes the `sinatra/reloader` gem to reload all source whenever a file in its source changes. It also has a built-in update function that will run `git pull`, so that deploys and updates are very easy.  

## Required Gems
Foosey uses the following gems:  

- `json`
- `inifile`
- `sinatra`
- `sinatra-json`
- `sinatra-cross_origin`
- `sinatra-namespace`
- `sinatra-reloader`
- `sqlite3`
