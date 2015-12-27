angular.module('foosey')
  .controller('LeaderboardController', function ($scope, localStorage, FooseyService) 
  {
  	// create a pull-to-refresh function
  	$scope.refresh = refresh;

  	// initialize the page
    $scope.refresh();
    $scope.loading = true;

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
