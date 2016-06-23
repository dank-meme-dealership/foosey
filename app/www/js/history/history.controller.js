(function()
{
  angular
    .module('history')
    .controller('HistoryController', HistoryController);

  HistoryController.$inject = ['$scope', 'localStorage', 'FooseyService', 'SettingsService'];

  function HistoryController($scope, localStorage, FooseyService, SettingsService)
  {
    var loaded = 0;
    var gamesToLoad = 30;
    $scope.loading = false;

    $scope.loadMore = loadMore;
    $scope.refresh = refresh;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      refresh();
    });

    // refresh page function
    function refresh()
    {
      // load from local storage
      $scope.games = localStorage.getObject('history');
      $scope.loading = true;
      loaded = 0;

      // get most recent games and group by the date
      FooseyService.getGames(gamesToLoad, 0)
      .then(function successCallback(result) 
      { 
        // get games from server
        $scope.games = result;
        loaded += result.length;

        // store them to local storage
        localStorage.setObject('history', $scope.games);

        $scope.error = false;

        done();
      }, function errorCallback(response)
      {
        $scope.error = true;
        done();
      });
    }

    // infinite scroll
    function loadMore()
    {
      $scope.loading = true;
      
      FooseyService.getGames(gamesToLoad, loaded)
      .then(function successCallback(result)
      {
        // if no games have been loaded yet, we can't do anything
        if (!$scope.games) return;

        // push new games to the end of the games list
        $scope.games.push.apply($scope.games, result);
        loaded += result.length;

        // see if we can load more games or not
        $scope.allLoaded = $scope.games[$scope.games.length - 1].id === 0;

        done();
      })
    }

    // turns off spinner and notifies
    function done()
    {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.loading = false;
    }
  }
})();