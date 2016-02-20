# Foosey API Specification
This is the tentative specification for the Foosey API. It's subject to change before release

## Getting information about players

### Get information about all players
```
GET /v1/players
```

This will return a JSON array of all players, sorted by player ID.

```
[
    // all players
]
```

### Get information about one player
```
GET /v1/players/{id}
```

This will return information about player with ID `{id}`.

```
{
    playerID    : 1,
    displayName : "Matt"
    elo         : 1200,
    winrate     : .8792,
    totalGames  : 273
    isAdmin     : true,
    isActive: false  : false
}
```

### Get information about some players
```
GET /v1/players?ids={ids}
```

This will return information about all players with ID in `{ids}`, sorted by player ID.

```
[
    // players matching any id in {ids}
]
```

## Getting information about games

### Get the games a player has played in
```
GET /v1/players/{id}/games
```

This will return information about every game involving player with ID `{id}`, sorted by timestamp.

```
[
    // all games involving player with id {id}
]
```

### Get information about all games
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

### Get information about a game
```
GET /v1/games/{id}
```

This will return information about a game with ID `{id}`. There are currently two things this could return and we haven't decided which will be best yet.

```
// option 1
{
    gameID: 1,
    timestamp: 14551212312354534651561065456475367
    [
        { playerID: 2, score: 4 },
        { playerID: 4, score: 5 }
    ]
}

// option 2
{
    gameID: 1,
    timestamp: 14551212312354534651561065456475367
    teams: [
        {
            // actual player object, will be small
            players: [ ... ],
            change: 3
        },
        {
            // actual player object, will be small
            players: [ ... ],
            change: -3
        }
    ]
}
```

### Get information about some games
```
GET /v1/games?ids={ids}
```

This will return information about all games with ID in `{ids}`, sorted by timestamp.

```
[
    // games matching and id in {ids}
]
```

### Get information about some games at a time
```
GET /v1/games?limit={limit}&offset={offset}
```

This will return `{limit}` games, sorted by timestamp starting at `{offset}`.

```
[
    // {limit} games, sorted by timestamp, starting at {offset}
]
```

## Getting statistics

### Get all of the historic Elo values for a player
```
GET /v1/stats/elo/{player_id}
```

This will return an array of player with ID `{player_id}`'s Elo after every game they were involved in, sorted by timestamp.

```
[
    {
        gameID: 1,
        timestamp: 11111111111111111111111,
        elo: 1800
    },
    {
        gameID: 2,
        timestamp: 11111111111111111111112,
        elo: 6
    },
    ... // there is a lot of data in these stats calls
    // maybe require API key or something?)
]
```

### Get all of the historic win rate values for a player
```
GET /v1/stats/winrate/{player_id}
```

This will return an array of player with ID `{player_id}`'s win rate after every game they were involved in, sorted by timestamp.

```
[
    {
        gameID: 1,
        timestamp: 11111111111111111111111,
        winrate: 0.8
    },
    {
        gameID: 2,
        timestamp: 11111111111111111111112,
        winrate: 0.7
    },
    ...
]
```
