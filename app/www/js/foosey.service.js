(function()
{
  angular
    .module('foosey')
    .factory('FooseyService', FooseyService);

  FooseyService.$inject = ['$http'];

  function FooseyService($http) 
  {
    // var url = "http://localhost:4005/v1/";
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
      getBadges         : getBadges,
      addGame           : addGame,
      addPlayer         : addPlayer,
      editGame          : editGame, 
      editPlayer        : editPlayer,
      removeGame        : removeGame,
      update            : update
    }

    // filter is an argument to filter out inactive players
    // true will filter to just active players, false will not
    function getAllPlayers(filter)
    {
      return $http.get(url + 'players').then(
        function(response)
        {
          if (!filter) return response.data;
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

    function getPlayerGames(playerID, limit)
    {
      return $http.get(url + 'players/' + playerID + '/games' + (limit ? '?limit=' + limit : ''));
    }

    function getAllGames()
    {
      return $http.get(url + 'games').then(
        function (response)
        {
          return _.map(response.data, addDateInfo);
        });
    }

    function getGame(gameID)
    {
      return $http.get(url + 'games/' + gameID).then(
        function (response)
        {
          return _.map([response.data], addDateInfo);
        });
    }

    function getGamesByID(gameIDs)
    {
      return $http.get(url + 'games?ids=' + gameIDs).then(
        function (response)
        {
          return _.map(response.data, addDateInfo);
        });
    }

    function getGames(limit, offset)
    {
      return $http.get(url + 'games?limit=' + limit + '&offset=' + offset).then(
        function (response)
        {
          return _.map(response.data, addDateInfo);
        });
    }

    function addDateInfo(game)
    {
      var gameMoment = moment.unix(game.timestamp)

      game.date = gameMoment.format("MM/DD/YYYY");
      game.time = gameMoment.format("h:mma");
      return game;
    }

    function getAllEloHistory()
    {
      return $http.get(url + 'stats/elo');
    }

    function getEloHistory(playerID, limit)
    {
      return $http.get(url + 'stats/elo/' + playerID + (limit ? '?limit=' + limit : '')).then(
        function(response)
        {
          _.each(response.data, function(point)
          {
            point.date = moment.unix(point.timestamp).format("MM/DD");
          })
          return response;
        });
    }

    function getBadges()
    {
      return $http.get(url + 'badges');
    }

    function addGame(game)
    {
      return $http.post(url + 'games', game);
    }

    function addPlayer(player)
    {
      return $http.post(url + 'players', player);
    }

    function editGame(game)
    {
      return $http.put(url + 'games/' + game.id, game);
    }

    function editPlayer(player)
    {
      return $http.put(url + 'players/' + player.id, player);
    }

    function removeGame(gameID)
    {
      return $http.delete(url + 'games/' + gameID);
    }

    function update()
    {
      return $http.post("http://api.foosey.futbol/slack?user_name=matttt&text=update", {});
    }
  }
})();