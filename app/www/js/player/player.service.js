(function()
{
  angular
    .module('player')
    .factory('PlayerService', PlayerService);

  PlayerService.$inject = ['localStorage', 'FooseyService', 'SettingsService'];

  function PlayerService(localStorage, FooseyService, SettingsService)
  {
    var recentPlayersGames = 10;
    var recentCount = 6;

    var service = {
      all                 : getArrayFromCache('players'),
      active              : getArrayFromCache('activePlayers'),
      inactive            : getArrayFromCache('inactivePlayers'),
      recent              : getArrayFromCache('recentPlayers'),
      recentCount         : recentCount,

      updatePlayers       : updatePlayers,
      updateRecentPlayers : updateRecentPlayers
    };

    return service;

    // load from local storage
    function getArrayFromCache(property)
    {
      var array = localStorage.getObject(property);
      return _.isArray(array) ? array : [];
    }

    // filter is an argument to filter out inactive players
    // true will filter to just active players, false will not
    function updatePlayers()
    {
      FooseyService.getAllPlayers().then(
        function (players)
        { 
          // all players
          service.all = players;
          service.all.sort(function(a, b){
            return a.displayName.localeCompare(b.displayName);
          });
          localStorage.setObject('players', service.all);

          // active players
          service.active = _.filter(service.all, function(player){ return player.active });
          localStorage.setObject('activePlayers', service.active);

          // inactive players
          service.inactive = _.filter(service.all, function(player){ return player.active });
          localStorage.setObject('inactivePlayers', service.inactive);
        });
    }

    // update the recent players for add game
    function updateRecentPlayers(playerID)
    {
      return FooseyService.getPlayerGames(playerID, recentPlayersGames).then(
        function(response)
        {
          var recents = [];
          _.each(response.data, function(game)
          {
            _.each(game.teams, function(team)
            {
              _.each(team.players, function(player)
              {
                recents = _.unionBy(recents, [player], 'playerID');
              }); 
            });
          });
          var you = _.remove(recents, function(p) 
            { 
              return p.playerID === playerID;
            });
          service.recent = _.union(you, recents);

          localStorage.setObject('recentPlayers', service.recent);
        });
    }
  }
})();