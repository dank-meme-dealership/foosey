(function () {
  angular
    .module('foosey.experiments.api', [])
    .factory('api', api);

  function api($http) {
    var service = {
      url: 'http://api.foosey.futbol/v1/',

      getAllPlayers: getAllPlayers,
      getAllEloHistory: getAllEloHistory
    };

    return service;

    /**
     * Get all players for a league, filter inactive players if you want
     * @param leagueID
     * @param filter
     */
    function getAllPlayers(leagueID, filter) {
      return $http.get(service.url + leagueID + '/players').then(function (response) {
        response.data = _.sortBy(response.data, 'displayName');
        if (!filter) return response.data;
        response = _.filter(response.data, function (player) {
          return player.active;
        });
        return response;
      });
    }

    /**
     * Get all elo stats for a league
     * @param leagueID
     */
    function getAllEloHistory(leagueID) {
      return $http.get(service.url + leagueID + '/stats/elo');
    }
  }
})();
