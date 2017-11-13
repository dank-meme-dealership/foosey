(function () {
  angular
    .module('foosey')
    .factory('FooseyService', FooseyService);

  function FooseyService($http, SettingsService) {
    return {
      addGame: addGame,
      addPlayer: addPlayer,
      addLeague: addLeague,
      editGame: editGame,
      editPlayer: editPlayer,
      getAllPlayers: getAllPlayers,
      getPlayer: getPlayer,
      getPlayersByID: getPlayersByID,
      getPlayerGames: getPlayerGames,
      getHistory: getHistory,
      getAllGames: getAllGames,
      getGame: getGame,
      getGamesByID: getGamesByID,
      getGames: getGames,
      getEloHistory: getEloHistory,
      getBadges: getBadges,
      getLeague: getLeague,
      info: info,
      removeGame: removeGame,
      update: update
    };

    function url() {
      return "http://api.foosey.futbol/v1/";
      // return "http://localhost:4005/v1/";
    }

    function addGame(game) {
      return $http.post(url() + SettingsService.league.leagueID + '/games', game);
    }

    // leagueID is optional
    function addPlayer(player, leagueID) {
      var id = leagueID ? leagueID : SettingsService.league.leagueID;
      return $http.post(url() + id + '/players', player);
    }

    function addLeague(league) {
      return $http.post(url() + 'leagues', league);
    }

    function editGame(game) {
      return $http.put(url() + SettingsService.league.leagueID + '/games/' + game.id, game);
    }

    function editPlayer(player) {
      return $http.put(url() + SettingsService.league.leagueID + '/players/' + player.id, player);
    }

    // filter is an argument to filter out inactive players
    // true will filter to just active players, false will not
    // leagueID is also optional
    function getAllPlayers(filter, leagueID) {
      var id = leagueID ? leagueID : SettingsService.league.leagueID;
      return $http.get(url() + id + '/players').then(function (response) {
        response.data = _.sortBy(response.data, 'displayName');
        if (!filter) return response.data;
        response = _.filter(response.data, function (player) {
          return player.active;
        });
        return response;
      });
    }

    function getPlayer(playerID) {
      return $http.get(url() + SettingsService.league.leagueID + '/players/' + playerID);
    }

    function getPlayersByID(playerIDs) {
      return $http.get(url() + SettingsService.league.leagueID + '/players?ids=' + playerIDs);
    }

    function getPlayerGames(playerID, limit) {
      return $http.get(url() + SettingsService.league.leagueID + '/players/' + playerID + '/games' + (limit ? '?limit=' + limit : ''));
    }

    function getHistory(playerIDs) {
      return $http.get(url() + SettingsService.league.leagueID + '/history?ids=' + playerIDs).then(function (response) {
        return _.map(response.data, addDateInfo);
      });
    }

    function getAllGames() {
      return $http.get(url() + SettingsService.league.leagueID + '/games').then(function (response) {
        return _.map(response.data, addDateInfo);
      });
    }

    function getGame(gameID) {
      return $http.get(url() + SettingsService.league.leagueID + '/games/' + gameID).then(function (response) {
        return _.map([response.data], addDateInfo);
      });
    }

    function getGamesByID(gameIDs) {
      return $http.get(url() + SettingsService.league.leagueID + '/games?ids=' + gameIDs).then(function (response) {
        return _.map(response.data, addDateInfo);
      });
    }

    function getGames(limit, offset) {
      return $http.get(url() + SettingsService.league.leagueID + '/games?limit=' + limit + '&offset=' + offset).then(function (response) {
        return _.map(response.data, addDateInfo);
      });
    }

    // helper function for games calls
    function addDateInfo(game) {
      var gameMoment = moment.unix(game.timestamp)

      game.date = gameMoment.format("MM/DD/YYYY");
      game.time = gameMoment.format("h:mma");
      return game;
    }

    function getLeague(leagueName) {
      return $http.get(url() + 'leagues/' + leagueName);
    }

    function getAllEloHistory() {
      return $http.get(url() + SettingsService.league.leagueID + '/stats/elo');
    }

    function getEloHistory(playerID, limit) {
      return $http.get(url() + SettingsService.league.leagueID + '/stats/elo/' + playerID + (limit ? '?limit=' + limit : '')).then(function (response) {
        _.each(response.data, function (point) {
          point.date = moment.unix(point.timestamp).format("MM/DD");
        });
        return response;
      });
    }

    function getBadges() {
      return $http.get(url() + SettingsService.league.leagueID + '/badges?id=' + SettingsService.playerID);
    }

    function info() {
      return $http.get(url() + 'info');
    }

    function removeGame(gameID) {
      return $http.delete(url() + SettingsService.league.leagueID + '/games/' + gameID);
    }

    function update() {
      return $http.post("http://api.foosey.futbol/slack?user_name=matttt&text=update", {});
    }
  }
})();
