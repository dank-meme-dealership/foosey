(function () {
  angular
    .module('compare')
    .controller('CompareController', CompareController);

  CompareController.$inject = ['$scope', '$stateParams', 'FooseyService', 'PlayerService', 'SettingsService'];

  function CompareController($scope, $stateParams, FooseyService, PlayerService, SettingsService) {
    // the logged in player's id is stored in the settings service 
    $scope.you = PlayerService.getByID(SettingsService.playerID);
    // the player to compare to is passed via $stateparams
    $scope.them = PlayerService.getByID(parseInt($stateParams.playerID));
    console.log($scope.them);

    FooseyService.getHistory(SettingsService.playerID + ',' + $stateParams.playerID).then(
      function successCallback(response) {
        $scope.games = response;

        // pnly attempt to get the record if there are games played
        if (response.length > 0) getRecord();
      });

    function getRecord() {
      $scope.teams = _.clone($scope.games[0].teams);
      $scope.teams[0].wins = 0;
      $scope.teams[1].wins = 0;
      $scope.teams[0].totalChange = 0;
      $scope.teams[1].totalChange = 0;
      _.each($scope.games, function (game) {
        // the first team is always the winner so add a win to whoever it's for
        var winner = game.teams[0].players[0].playerID === $scope.teams[0].players[0].playerID;
        $scope.teams[winner ? 0 : 1].wins++;
        $scope.teams[0].totalChange += game.teams[winner ? 0 : 1].delta;
        $scope.teams[1].totalChange += game.teams[winner ? 1 : 0].delta;
      });
    }
  }
})();