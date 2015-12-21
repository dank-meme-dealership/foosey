angular.module('foosey')
  .controller('LeaderboardController', function ($scope, FooseyService) 
  {
    // get foosey
    FooseyService.foosey().then(function(result) { 
      $scope.foosey = result.data;
    });

  });
