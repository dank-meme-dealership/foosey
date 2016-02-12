# foosey
The ultimate all-in-one foosball ranking Slack Bot

## Forward
This bot has some work to be done before it's useful to anyone other than the individuals at WhiteCloud Analytics. Stay tuned!

## Required Gems
Foosey uses the following gems:  

- `json`
- `inifile`
- `sinatra`
- `sinatra-json`
- `sinatra-cross_origin`

## Required Files
Foosey looks for a file named `foosey.ini` for some settings. Here is what `foosey.ini` should look like:  

```ini
[settings]
# used by the app/website to post activity to Slack.
slack_url = https://hooks.slack.com/services/XXXXXXXXX/XXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX
# admins can utilize special commands like `redeploy`
admins = brik,matttt
# these players don't show up on leaderboards but their history is still known
ignore = daniel,jody,josh
```
