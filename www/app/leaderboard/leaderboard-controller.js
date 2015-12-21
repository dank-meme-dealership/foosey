angular.module('foosey')
  .controller('LeaderboardController', function ($scope, FooseyService) 
  {
    // get elos
    FooseyService.elo().then(function(result) { 
      $scope.foosey = result.data;
    });

  });
