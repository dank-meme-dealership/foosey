(function()
{
  angular
    .module('foosey')
    .controller('MenuController', MenuController);

  MenuController.$inject = ['$scope', 'SettingsService'];

  function MenuController($scope, SettingsService)
  {
    $scope.playerID = SettingsService.playerID;

    $scope.getPlayerID = getPlayerID;

    function getPlayerID()
    {
      return SettingsService.playerID;
    }
  }

})();