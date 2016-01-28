angular
  .module('leaderboard', [])
  .controller('LeaderboardController', LeaderboardController);

function LeaderboardController($scope, localStorage, $ionicSlideBoxDelegate, FooseyService) 
{
	// create a pull-to-refresh function
	$scope.refresh = refresh;

	// initialize the page
  $scope.refresh();
  $scope.slide = 0;
  $scope.loading = true;
  $scope.minimumQualified = 10;

  // function for swiping between views
  $scope.changeSlide = function(index)
  {
    $scope.slide = index;
  }

  $scope.slideTo = function(index)
  {
    $ionicSlideBoxDelegate.slide(index);
  }

  // refresh function
  function refresh()
  {
    // get elos
    getStats();
  }

  // gets the list of names and elos
  function getStats()
  {
    // load from local storage
    $scope.elos = localStorage.getObject('elos');
    $scope.avgs = localStorage.getObject('avgs');
    $scope.percent = localStorage.getObject('percent');

    // load from server
    FooseyService.leaderboard().then(function successCallback(response)
    { 
      $scope.elos = filterElos(response.data.elos);
      $scope.avgs = response.data.avgs;
      $scope.percent = response.data.percent;
      $ionicSlideBoxDelegate.update();
      localStorage.setObject('elos', $scope.elos);
      localStorage.setObject('avgs', $scope.avgs);
      localStorage.setObject('percent', $scope.percent);
      $scope.error = false;
      
      done();
    }, function errorCallback(response)
    {
      $scope.error = true;
      done();
    });
  }

  // filters out people that have not yet played enough games
  function filterElos(elos)
  {
    var filteredElos = [];
    var unranked = [];
    var rank = 1;

    // set rank and if they're qualified
    for (var i = 0; i < elos.length; i++)
    {
      if (elos[i].games >= $scope.minimumQualified)
      {
        elos[i].rank = rank;
        elos[i].qualified = true;
        rank++;
        filteredElos.push(elos[i]);
      }
      else
      {
        elos[i].rank = '-';
        unranked.push(elos[i]);
      }
    }

    // add unranked to bottom
    for (var i = 0; i < unranked.length; i++)
    {
      filteredElos.push(unranked[i]);
    }

    return filteredElos;
  }

  function sortElos(a, b)
  {
    if (a.qualified && b.qualified)
      return a.elo - b.elo;
    else
      return -1;
  }

  // turns off spinner and notifies
  function done()
  {
    $scope.loading = false;
    $scope.$broadcast('scroll.refreshComplete');
  }

}