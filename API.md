# Foosey API Specification
This is the tentative specification for the Foosey API. It's subject to change before release

## Getting Player Information

### All Players
```
GET /v1/players
```

This will return a JSON array of all players, sorted by player ID.

```
[
    // all players
]
```

### One Player
```
GET /v1/players/{id}
```

This will return information about player with ID `{id}`.

```
{
    "playerID": 1,
    "displayName": "Matt",
    "elo": 1200,
    "winrate": 0.8792,
    "totalGames": 273,
    "isAdmin": true,
    "isActive": false
}
```

### Multiple Players
```
GET /v1/players?ids={ids}
```

This will return information about all players with ID in `{ids}`, sorted by player ID.

```
[
    // players matching any id in {ids}
]
```

## Game Information

### Games a Player Has Played In
```
GET /v1/players/{id}/games
```

This will return information about every game involving player with ID `{id}`, sorted by timestamp.

```
[
    // all games involving player with id {id}
]
```

### All Games
```
GET /v1/games
```

This will return information about all games, sorted by timestamp.

```
[
    // all games, sorted by timestamp
    // yikes... do any APIs do a /more or something?
]
```

### One Game
```
GET /v1/games/{id}
```

This will return information about a game with ID `{id}`.

```
{
    "gameID": 1,
    "timestamp": 1456430558
    "teams": [
        {
            "players": [ 1, 8 ],
            "delta": 3
        },
        {
            "players": [ 3, 5 ],
            "delta": -3
        }
    ]
}
```

### Multiple Games
```
GET /v1/games?ids={ids}
```

This will return information about all games with ID in `{ids}`, sorted by timestamp.

```
[
    // games matching and id in {ids}
]
```

### Multiple Games with Limit and Offset
```
GET /v1/games?limit={limit}&offset={offset}
```

This will return `{limit}` games, sorted by timestamp starting at `{offset}`.

```
[
    // {limit} games, sorted by timestamp, starting at {offset}
]
```

## Statistics

### Player Elo History
```
GET /v1/stats/elo/{player_id}
```

This will return an array of player with ID `{player_id}`'s Elo after every game they were involved in, sorted by timestamp.

```
[
    {
        "gameID": 1,
        "timestamp": 1456430558,
        "elo": 1800
    },
    {
        "gameID": 2,
        "timestamp": 1456430558,
        "elo": 6
    },
    ... // there is a lot of data in these stats calls
    // maybe require API key or something?)
]
```

### Player Win Rate History
```
GET /v1/stats/winrate/{player_id}
```

This will return an array of player with ID `{player_id}`'s win rate after every game they were involved in, sorted by timestamp.

```
[
    {
        "gameID": 1,
        "timestamp": 1456430558,
        "winrate": 0.8
    },
    {
        "gameID": 2,
        "timestamp": 1456430558,
        "winrate": 0.7
    },
    ...
]
```

## Adding Objects

### Add Game
```
POST /v1/add/game
```
Sample body:
```
{
    "timestamp": 
    "teams": [
        {
            "players": [2, 1],
            "score": 10
        },
        {
            "players": [6, 3],
            "score": 0
        }
    ]
}
```
`teams` is an array of each team involved in the game, with `players` being an array of player IDs. There must be at least 2 teams with at least 1 player on each team. The team with the highest score is considered the winner. If `timestamp` is not present in the body, the current time will be used.  
The game will be added to the database and the response will look similar to:
```
{
    "error": false,
    "message": "Game added."
}
```
or
```
{
    "error": true,
    "message": "Player 'Tanya' does not exist."
}
```

### Add Player
```
POST /v1/add/player
```
Sample body:
```
{
    "displayName": "Tanya",
    "slackName": "@tanya",
    "admin": false,
    "active": true
}
```
`admin` and `active` will default to the values shown above, and do not need to be present in the body.  
The player will be added to the team and the response will look similar to:
```
{
    "error": false,
    "message": "Player added."
}
```
or
```
{
    "error": true,
    "message": "Player 'Tanya' already exists."
}
```

## Editing Objects

### Edit Game
```
POST /v1/edit/game
```
Sample body:
```
{
    "id": 3,
    "timestamp": 1456430558,
    "teams": [
        {
            "players": [2, 1],
            "score": 10
        },
        {
            "players": [6, 3],
            "score": 0
        }
    ]
}
```
The game with ID `id` will be replaced with the new data. This follows the same restrictions as adding a game. If `timestamp` is not present in the body, it will be unchanged.  
The response will look similar to the following:
```
{
    "error": false,
    "message": "Game edited."
}
```
or
```
{
    "error": true,
    "message": "Game 3 does not exist."
}
```

### Edit Player
```
POST /v1/edit/player
```
Sample body:
```
{
    "id": 4,
    "displayName": "Tanya",
    "slackName": "@tanya",
    "admin": false,
    "active": true
}
```
Player with ID `id` will be updated with the new data. Any fields other than `id` that are left out will be unchanged in the database.  
The response will look similar to the following:
```
{
    "error": false,
    "message": "Player updated."
}
```
or
```
{
    "error": true,
    "message": "Player with ID 4 does not exist."
}
```

## Removing Objects

### Remove Game
```
DELETE /v1/remove/game
```
Sample body:
```
{
    "games": [150, 455, 2]
}
```
All games with ID in `games` will be removed from the database. The response will look similar to:
```
{
    "error": false,
    "message": "Game(s) removed."
}
```
or
```
{
    "error": true,
    "message": "Game 455 does not exist."
}
```

### Remove Player
```
DELETE /v1/remove/player
```
Sample body:
```
{
    "players": [2]
}
```
All players with id in `players` will be removed from the database, as well as any games they were involved in. The response will look similar to:
```
{
    "error": false,
    "message": "Player(s) removed."
}
```
or
```
{
    "error": true,
    "message": "Player with ID 10 does not exist."
}
```
