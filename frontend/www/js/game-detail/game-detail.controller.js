(function()
{
  angular
    .module('gameDetail')
    .controller('GameDetailController', GameDetailController);

  GameDetailController.$inject = ['$scope', '$stateParams', '$ionicPopup', '$ionicHistory', 'FooseyService', 'SettingsService'];

  function GameDetailController($scope, $stateParams, $ionicPopup, $ionicHistory, FooseyService, SettingsService)
  {
    $scope.settings = SettingsService;
    $scope.disabled = true;
    $scope.game = undefined;

    $scope.remove = confirmRemove;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
      loadGame();
    });

    function loadGame()
    {
      $scope.disabled = true;
      FooseyService.getGame($stateParams.gameID).then(
        function successCallback(response)
        {
          $scope.game = response;

          // get playerIDs and fetch similar games
          var playerIDs = _.map(response[0].teams[0].players, 'playerID').join(',') + ',' + 
                          _.map(response[0].teams[1].players, 'playerID').join(',');
          fetchSimilarGames(playerIDs);
        });
    }

    function fetchSimilarGames(playerIDs)
    {
      FooseyService.getHistory(playerIDs).then(
        function successCallback(response)
        {
          $scope.games = response;
          $scope.disabled = false;

          getRecord();
        });
    }

    function getRecord()
    {
      $scope.teams = _.clone($scope.games[0].teams);
      $scope.teams[0].wins = 0;
      $scope.teams[1].wins = 0;
      $scope.teams[0].totalChange = 0;
      $scope.teams[1].totalChange = 0;
      _.each($scope.games, function(game)
      {
        // the first team is always the winner so add a win to whoever it's for
        var winner = game.teams[0].players[0].playerID === $scope.teams[0].players[0].playerID;
        $scope.teams[winner ? 0 : 1].wins++;
        $scope.teams[0].totalChange += game.teams[winner ? 0 : 1].delta;
        $scope.teams[1].totalChange += game.teams[winner ? 1 : 0].delta;
      });
    }

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