(function()
{
  angular
    .module('compare')
    .controller('CompareController', CompareController);

  CompareController.$inject = ['$scope', '$stateParams', 'FooseyService', 'PlayerService', 'SettingsService'];

  function CompareController($scope, $stateParams, FooseyService, PlayerService, SettingsService)
  {
    // the logged in player's id is stored in the settings service 
    $scope.you = PlayerService.getByID(SettingsService.playerID);
    // the player to compare to is passed via $stateparams
    $scope.them = PlayerService.getByID(parseInt($stateParams.playerID));
    console.log($scope.them);

    FooseyService.getHistory(SettingsService.playerID + ',' + $stateParams.playerID).then(
        function successCallback(response)
        {
          $scope.games = response;
        });
  }
})();