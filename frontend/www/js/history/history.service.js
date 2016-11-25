(function()
{
  angular
    .module('history')
    .factory('HistoryService', HistoryService);

  HistoryService.$inject = ['localStorage', 'FooseyService'];

  function HistoryService(localStorage, FooseyService)
  {
    var loaded = 0;
    var gamesToLoad = 30;

    var service = {
      allLoaded : false,
      games     : localStorage.getObject('history'),
      refresh   : refresh,
      loadMore  : loadMore
    };

    return service;

    // refresh page function
    function refresh()
    {
      // load from local storage
      service.games = localStorage.getObject('history');
      loaded = 0;

      // get most recent games and group by the date
      return FooseyService.getGames(gamesToLoad, 0).then(
        function(response) 
        { 
          // get games from server
          service.games = response;
          loaded += response.length;

          // store them to local storage
          localStorage.setObject('history', service.games);

          // see if we can load more games or not
          service.allLoaded = response.length === 0;
        });
    }

    // infinite scroll
    function loadMore()
    { 
      if (loaded === 0) return;
      return FooseyService.getGames(gamesToLoad, loaded).then(
        function(response)
        {
          // if no games have been loaded yet, we can't do anything
          if (!service.games) return;

          // push new games to the end of the games list
          service.games.push.apply(service.games, response);
          loaded += response.length;

          // see if we can load more games or not
          service.allLoaded = response.length === 0;
        });
    }
  }
})();