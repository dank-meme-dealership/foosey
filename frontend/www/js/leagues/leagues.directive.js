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

  controller.$inject = ['$scope', 'SettingsService', 'PlayerService'];

  function controller($scope, SettingsService, PlayerService)
  {
    $scope.settings = SettingsService;

    $scope.selectLeague = selectLeague;

    function selectLeague(league)
    {
      SettingsService.logIn(league);
      PlayerService.updatePlayers();
    }
  }

})();