(function()
{
  angular
    .module('gameDetail')
    .controller('GameDetailController', GameDetailController);

  GameDetailController.$inject = ['$scope', '$stateParams', '$ionicPopup', '$ionicHistory', 'FooseyService'];

  function GameDetailController($scope, $stateParams, $ionicPopup, $ionicHistory, FooseyService)
  {
    $scope.remove = confirmRemove;

    FooseyService.getGame($stateParams.gameID).then(
      function successCallback(response)
      {
        $scope.game = response.data;
      });

    FooseyService.getAllGames().then(
      function successCallback(response)
      {
        $scope.games = response.data;
      });

        // confirm that they actually want to remove
    function confirmRemove()
    {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Remove This Game',
        template: 'Are you sure you want to remove this game? This cannot be undone.'
      });

      // if yes, delete the last game
      confirmPopup.then(function(positive) {
        if(positive) {
          remove();
        }
      });
    }

    // Remove game
    function remove()
    {
      FooseyService.removeGame($stateParams.gameID)
      .then(function()
      {
        $ionicHistory.goBack();
      });
    }
  }
})();