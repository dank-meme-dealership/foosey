angular.module('foosey')
  .controller("FooseyController", function ($scope, FooseyService) 
  {
    // get foosey
    FooseyService.foosey().then(function(result) { 
      $scope.foosey = result.data;
    });

  });
