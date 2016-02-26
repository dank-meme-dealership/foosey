angular
  .module('foosey')
  .factory('FooseyService', function($http) 
  {
    var oldUrl = "http://api.foosey.futbol/app";
    var url = "http://api.foosey.futbol/v1/";

	  return {
      getAllPlayers     : getAllPlayers,
      getPlayer         : getPlayer,
      getPlayersByID    : getPlayersByID,
      getPlayerGames    : getPlayerGames,
      getAllGames       : getAllGames,
      getGame           : getGame,
      getGamesByID      : getGamesByID,
      getGames          : getGames,
      getEloHistory     : getEloHistory,
      getWinRateHistory : getWinRateHistory,
      addGame           : addGame,
      addPlayer         : addPlayer,
      editGame          : editGame, 
      editPlayer        : editPlayer,
      removeGames       : removeGames,
      removePlayers     : removePlayers,
      undo              : undo
    }

    function getAllPlayers()
    {
      return $http.get('json/players.json');
      // return $http.get(url + 'players');
    }

    function getPlayer(playerID)
    {
      // return $http.get(url + 'players/' + playerID);
    }

    function getPlayersByID(playerIDs)
    {
      // return $http.get(url + 'players?ids=' + playerIDs);
    }

    function getPlayerGames(playerID)
    {
      // return $http.get(url + 'players/' + playerID + '/games');
    }

    function getAllGames()
    {
      // return $http.get(url + 'games');
    }

    function getGame(gameID)
    {
      // return $http.get(url + 'games/' + gameID);
    }

    function getGamesByID(gameIDs)
    {
      // return $http.get(url + 'games?ids=' + gameIDs);
    }

    function getGames(limit, offset)
    {
      // return $http.get(url + 'games?limit=' + limit + '&offest=' + offest);
    }

    function getEloHistory(playerID)
    {
      // return $http.get(url + 'stats/elo/' + playerID);
    }

    function getWinRateHistory(playerID)
    {
      // return $http.get(url + 'stats/winrate/' + playerID);
    }

    function addGame(game)
    {
      data =
      {
        text: game,
        user_name: "app",
        device: "app"
      }
      return $http.post(oldUrl, data)
      // return $http.post(url + 'add/game', game);
    }

    function addPlayer(player)
    {
      // return $http.post(url + 'add/player', player);
    }

    function editGame(game)
    {
      // return $http.post(url + 'edit/game', game);
    }

    function editPlayer(player)
    {
      // return $http.post(url + 'edit/player', player);
    }

    function removeGames(games)
    {
      // return $http.delete(url + 'remove/game' + games);
    }

    function removePlayers(players)
    {
      // return $http.delete(url + 'remove/player' + players);
    }

    function undo()
    {
      console.log("Will maybe implement again");
    }

  });