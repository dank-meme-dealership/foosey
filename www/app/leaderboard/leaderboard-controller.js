angular.module('leaderboard', [])
  .controller('LeaderboardController', function ($scope, localStorage, $ionicSlideBoxDelegate, FooseyService) 
  {
  	// create a pull-to-refresh function
  	$scope.refresh = refresh;

  	// initialize the page
    $scope.refresh();
    $scope.title = "ELO Ratings";
    $scope.loading = true;

    // function for swiping between views
    $scope.changeSlide = function(index)
    {
      if (index === 0)
        $scope.title = "ELO Ratings";
      else if (index === 1)
        $scope.title = "Average Score Per Game";
      else if (index === 2)
        $scope.title = "% Games Won";
    }

    // refresh function
    function refresh()
    {
      // get elos
      getElos();
    }

    // gets the list of names and elos
    function getElos()
    {
      // load from local storage
      $scope.elos = localStorage.getObject('elos');

      // load from server
      FooseyService.elo().then(function successCallback(response)
      { 
        $scope.elos = response.data.elos;
        $ionicSlideBoxDelegate.update();
        localStorage.setObject('elos', $scope.elos);
        done();
      }, function errorCallback(response)
      {
        $scope.error = true;
        done();
      });
    }

    // turns off spinner and notifies
    function done()
    {
      $scope.loading = false;
      $scope.$broadcast('scroll.refreshComplete');
    }

  });
