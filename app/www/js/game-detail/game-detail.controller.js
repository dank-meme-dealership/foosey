(function()
{
  angular
    .module('gameDetail')
    .controller('GameDetailController', GameDetailController);

  GameDetailController.$inject = ['$scope', '$stateParams', '$ionicPopup', '$ionicHistory', 'FooseyService', 'SettingsService'];

  function GameDetailController($scope, $stateParams, $ionicPopup, $ionicHistory, FooseyService, SettingsService)
  {
    $scope.settings = SettingsService;
    $scope.fetching = false;

    $scope.remove = confirmRemove;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      loadGame();
    });

    function loadGame()
    {
      FooseyService.getGame($stateParams.gameID).then(
        function successCallback(response)
        {
          $scope.game = response;
          // only two people in game
          if ($scope.game[0].teams.length === 2 && $scope.game[0].teams[0].players.length === 1)
          {
            $scope.teams = _.clone($scope.game[0].teams);
            $scope.fetching = true;
            var p1 = $scope.game[0].teams[0].players[0].playerID;
            var p2 = $scope.game[0].teams[1].players[0].playerID;
            fetchSimilarGames(p1, p2);
          }
        });
    }

    function fetchSimilarGames(p1, p2)
    {
      FooseyService.getPlayerGames(p1).then(
      function successCallback(response1)
      {
        FooseyService.getPlayerGames(p2).then(
        function successCallback(response2)
        {
          $scope.games = _.filter(_.intersectionBy(response1.data, response2.data, 'gameID'), function(game)
            {
              return game.teams.length === 2 && game.teams[0].players.length === 1;
            });
          getRecord();
        });
      });
    }

    function getRecord()
    {
      $scope.teams[0].wins = 0;
      $scope.teams[1].wins = 0;
      _.each($scope.games, function(game)
      {
        // the first team is always the winner so add a win to whoever it's for
        game.teams[0].players[0].playerID === $scope.teams[0].players[0].playerID ? $scope.teams[0].wins++ : $scope.teams[1].wins++;
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