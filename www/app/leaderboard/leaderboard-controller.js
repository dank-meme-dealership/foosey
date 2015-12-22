angular.module('foosey')
  .controller('LeaderboardController', function ($scope, FooseyService) 
  {
  	// create a pull-to-refresh function
  	$scope.refresh = refresh;

  	// initialize the page
    $scope.refresh();

    function refresh()
    {
    	// get elos
    	FooseyService.elo().then(function(result) { 
      	$scope.elos = result.data.elos;
    		$scope.$broadcast('scroll.refreshComplete');
    	});
    }

  });
