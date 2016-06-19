(function()
{
  angular
    .module('badges')
    .directive('badges', badges);

  function badges()
  {
    var directive = {
      restrict    : 'EA',
      scope       : {
        player : '='
      },
      controller  : controller,
      templateUrl : 'app/badges/badges.html'
    }

    return directive;
  }

  controller.$inject = ['$scope', 'BadgesService'];

  function controller($scope, BadgesService)
  {
    $scope.service = BadgesService;
  }
})();