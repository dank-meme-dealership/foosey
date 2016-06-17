(function()
{
  angular
    .module('history')
    .controller('HistoryController', HistoryController);

  HistoryController.$inject = ['$scope', '$state', '$filter', 'localStorage', 'FooseyService', 'SettingsService'];

  function HistoryController($scope, $state, $filter, localStorage, FooseyService, SettingsService)
  {
    var loaded = 0;
    var gamesToLoad = 30;
    $scope.loading = true;
    $scope.settings = SettingsService;

    $scope.loadMore = loadMore;
    $scope.show = show;
    $scope.refresh = refresh;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      refresh();
    });

    // toggleFilter('Peter');
    // clearFilters();

    // refresh page function
    function refresh()
    {
      // load from local storage
      $scope.dates = groupByDate(localStorage.getObject('history'));
      loaded = 0;

      // get most recent games and group by the date
      FooseyService.getGames(gamesToLoad, 0)
      .then(function successCallback(result) 
      { 
        // get games from server
        $scope.games = result;
        loaded += result.length;

        // filter by name
        applyFilters();

        // store them to local storage
        localStorage.setObject('history', $scope.games);

        // sort the games by date
        $scope.dates = groupByDate($scope.filteredGames);

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
      console.log("Loading new games starting from " + loaded + " to " + (loaded + gamesToLoad));
      FooseyService.getGames(gamesToLoad, loaded)
      .then(function successCallback(result)
      {
        // if no games have been loaded yet, we can't do anything
        if (!$scope.games) return;

        // push new games to the end of the games list
        $scope.games.push.apply($scope.games, result);
        console.log("Loaded " + result.length);
        loaded += result.length;

        // see if we can load more games or not
        $scope.allLoaded = $scope.games[$scope.games.length - 1].id === 0;

        // filter by name
        applyFilters();

        // sort the games by date
        $scope.dates = groupByDate($scope.filteredGames);

        // broadcast
        $scope.$broadcast('scroll.infiniteScrollComplete');
      })
    }

    // group the games by date
    function groupByDate(games)
    {
      return _.isArray(games) ? _.values(
        _.groupBy(games, 'date'), function(value, key) 
        { 
          value.date = key; return value; 
        }) : [];
    }

    // turns off spinner and notifies
    function done()
    {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.loading = false;
    }

    // show the action sheet for deleting games
    function show(gameID) 
    {
      $state.go('app.game-detail', { gameID: gameID });
    };

    function toggleFilter(name)
    {
      var filters = localStorage.getObject('filters');
      filters     = _.xor(filters, [name]);
      localStorage.setObject('filters', filters);
    }

    function clearFilters()
    {
      localStorage.setObject('filters', []);
    }

    function applyFilters()
    {
      $scope.filteredGames = [];
      var filters = localStorage.getObject('filters');
      if (filters && filters.length > 0)
      {
        _.forEach($scope.games, function(game)
        {
          var include = true
          _.forEach(filters, function(name)
          {
            if (!gameIncludes(game, name)) 
              include = false;
          });
          if (include) $scope.filteredGames.push(game);
        });
      }
      else
      {
        $scope.filteredGames = $scope.games
      }
    }

    function gameIncludes(game, name)
    {
      var include = false;
      _.forEach(game.teams, function(team)
      {
        if (_.includes(team.players, name)) 
          include = true;
      })
      return include;
    }
  }
})();