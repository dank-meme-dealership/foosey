(function()
{
  angular
    .module('leagues')
    .directive('leagues', leagues);

  function leagues()
  {
    var directive = {
      restrict    : 'EA',
      scope       : { manage: '=' },
      controller  : controller,
      templateUrl : 'js/leagues/leagues.html'
    }

    return directive;
  }

  controller.$inject = ['$scope', 'SettingsService'];

  function controller($scope, SettingsService)
  {
    $scope.settings = SettingsService;
  }

})();