(function()
{
  angular
    .module('history')
    .controller('HistoryController', HistoryController);

  HistoryController.$inject = ['$scope', '$ionicPopup', '$ionicActionSheet', '$filter', 'localStorage', 'FooseyService', 'SettingsService'];

  function HistoryController($scope, $ionicPopup, $ionicActionSheet, $filter, localStorage, FooseyService, SettingsService)
  {
    // send to login screen if they haven't logged in yet
    if (!SettingsService.loggedIn) SettingsService.logOut();
    
    var loaded = 0;
    var gamesToLoad = 30;
    $scope.removing = false;
    $scope.loading = true;
    $scope.settings = SettingsService;

    $scope.loadMore = loadMore;
    $scope.show = show;
    $scope.refresh = refresh;

    refresh();

    // toggleFilter('Peter');
    // clearFilters();

    // refresh page function
    function refresh()
    {
      // load from local storage
      $scope.dates = localStorage.getObject('history');
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

        // sort the games by date
        $scope.dates = groupByDate($scope.filteredGames);

        // store them to local storage
        localStorage.setObject('history', $scope.dates);
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
      FooseyService.getGames(gamesToLoad, loaded + gamesToLoad)
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
      return _.chain(games)
      .groupBy('date')
      .pairs()
      .map(function (currentItem)
      {
        return _.object(_.zip(['date', 'games'], currentItem));
      })
      .value();
    }

    // turns off spinner and notifies
    function done()
    {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.removing = false;
      $scope.loading = false;
    }

    // show the action sheet for deleting games
    function show(game) 
    {
      // Show the action sheet
      $ionicActionSheet.show(
      {
        titleText: $filter('time')(game.timestamp),
        destructiveText: 'Remove Game',
        cancelText: 'Cancel',
        destructiveButtonClicked: function(index) 
        {
          confirmRemove(game);
          return true;
        }
      });
    };

    // confirm that they actually want to remove
    function confirmRemove(game)
    {
      if ($scope.removing)
      {
        var alertPopup = $ionicPopup.alert({
          title: 'Can\'t Remove Game',
          template: '<center>Another game is already being removed at this time. Try again later.</center>'
        });
      }
      else
      {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Remove This Game',
          template: 'Are you sure you want to remove this game? This cannot be undone.'
        });

        // if yes, delete the last game
        confirmPopup.then(function(positive) {
          if(positive) {
            remove(game);
          }
        });
      }
    }

    // Remove game
    function remove(game)
    {
      // remove game from UI and re-sort by date
      var index = _.indexOf(_.pluck($scope.games, 'gameID'), game.gameID);
      $scope.games.splice(index, 1);
      $scope.dates = groupByDate($scope.games);
      localStorage.setObject('history', $scope.dates)

      // remove from server
      $scope.removing = true;
      $scope.loading = true;
      FooseyService.removeGame(game.gameID)
      .then(function()
      {
        refresh();
      });
    }

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