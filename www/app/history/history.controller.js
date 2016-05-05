angular
  .module('history')
  .controller('HistoryController', HistoryController);

function HistoryController($scope, $ionicPopup, $ionicActionSheet, $filter, localStorage, FooseyService)
{
  // some variables
  var loaded = 0;
  var gamesToLoad = 30;

  // create a pull-to-refresh function
  $scope.refresh = refresh;

  // initialize the page
  $scope.removing = false;
  $scope.loading = true;
  $scope.refresh();
  // toggleFilter('Peter');
  // clearFilters();

  // refresh page function
  function refresh()
  {
    // load from local storage
    $scope.dates = localStorage.getObject('history');

    // get most recent games and group by the date
    FooseyService.history(0, gamesToLoad)
    .then(function successCallback(result) 
    { 
      // get games from server
      $scope.games = result.data.games;
      loaded += result.data.games.length;

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
  $scope.loadMore = function()
  {
    console.log("Loading new games starting from " + loaded + " to " + (loaded + gamesToLoad));
    FooseyService.history(loaded, loaded + gamesToLoad)
    .then(function successCallback(result)
    {
      // if no games have been loaded yet, we can't do anything
      if (!$scope.games) return;

      // push new games to the end of the games list
      $scope.games.push.apply($scope.games, result.data.games);
      console.log("Loaded " + result.data.games.length);
      loaded += result.data.games.length;

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
  $scope.show = function(game) 
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
    var index = _.indexOf(_.pluck($scope.games, 'id'), game.id);
    decrementIds(index);
    $scope.games.splice(index, 1);
    $scope.dates = groupByDate($scope.games);
    localStorage.setObject('history', $scope.dates)

    // remove from server
    $scope.removing = true;
    $scope.loading = true;
    FooseyService.remove(game.id)
    .then(function()
    {
      refresh();
    });
  }

  // Decrement ids after given index so removing will remove the correct one.
  function decrementIds(index)
  {
    for (var i = index - 1; i >= 0; i--)
    {
      $scope.games[i].id--;
    }
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
    console.log(filters)
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