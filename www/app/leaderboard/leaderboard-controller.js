angular.module('foosey')
  .controller('LeaderboardController', function ($scope, FooseyService) 
  {
  	// create a pull-to-refresh function
  	$scope.refresh = refresh;

  	// initialize the page
    $scope.refresh();
    $scope.loading = true;

    function refresh()
    {
    	// get elos
    	FooseyService.elo().then(function successCallback(response)
      { 
      	$scope.elos = response.data.elos;
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
