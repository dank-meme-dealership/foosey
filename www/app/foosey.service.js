angular
  .module('foosey')
  .factory('FooseyService', function($http) 
  {
    var oldUrl = "http://api.foosey.futbol/app";
    var url = "http://beta.foosey.futbol/v1/";

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
      removeGame        : removeGame,
      removePlayer      : removePlayer,
      undo              : undo
    }

    function getAllPlayers()
    {
      return $http.get(url + 'players').then(
        function(response)
        {
          response = _.filter(response.data, function(player)
          {
            return player.active;
          });
          return response;
        });
    }

    function getPlayer(playerID)
    {
      return $http.get(url + 'players/' + playerID);
    }

    function getPlayersByID(playerIDs)
    {
      return $http.get(url + 'players?ids=' + playerIDs);
    }

    function getPlayerGames(playerID)
    {
      return $http.get(url + 'players/' + playerID + '/games');
    }

    function getAllGames()
    {
      return $http.get(url + 'games');
    }

    function getGame(gameID)
    {
      return $http.get(url + 'games/' + gameID);
    }

    function getGamesByID(gameIDs)
    {
      return $http.get(url + 'games?ids=' + gameIDs);
    }

    function getGames(limit, offset)
    {
      return $http.get(url + 'games?limit=' + limit + '&offset=' + offset).then(
        function (response)
        {
          return _.map(response.data, addDateInfo);
        });;
    }

    function addDateInfo(game)
    {
      var gameMoment = moment.unix(game.timestamp)

      game.date = gameMoment.format("MM/DD/YYYY");
      game.time = gameMoment.format("h:mma");
      return game;
    }

    function getEloHistory(playerID)
    {
      return $http.get(url + 'stats/elo/' + playerID).then(
        function(response)
        {
          _.each(response.data, function(point)
          {
            point.date = moment.unix(point.timestamp).format("MM/DD");
          })
          return response;
        });
    }

    function getWinRateHistory(playerID)
    {
      return $http.get(url + 'stats/winrate/' + playerID);
    }

    function addGame(game)
    {
      // data =
      // {
      //   text: game,
      //   user_name: "app",
      //   device: "app"
      // }
      // return $http.post(oldUrl, data)
      return $http.post(url + 'add/game', game);
    }

    function addPlayer(player)
    {
      return $http.post(url + 'add/player', player);
    }

    function editGame(game)
    {
      return $http.post(url + 'edit/game', game);
    }

    function editPlayer(player)
    {
      return $http.post(url + 'edit/player', player);
    }

    function removeGame(gameID)
    {
      return $http.delete(url + 'remove/game/' + gameID);
    }

    function removePlayer(playerID)
    {
      return $http.delete(url + 'remove/player/' + playerID);
    }

    function undo()
    {
      // Will maybe implement again
    }

  });