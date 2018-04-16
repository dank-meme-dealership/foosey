(function() {
    angular
      .module('settings')
      .controller('SettingsPickPlayerController', SettingsPickPlayerController);
  
      function SettingsPickPlayerController($scope, $state, $ionicHistory, PlayerService, SettingsService) {
        var $ctrl = this;
  
        $ctrl.selected = {};
  
        $ctrl.tapPlayer = tapPlayer;
        $ctrl.logIn = logIn;
  
        $scope.$on('$ionicView.afterEnter', function () {
          $ctrl.players = PlayerService.active;
        });

        function tapPlayer(player) {
          $ctrl.selected = player;
        }
  
        function logIn(player) {
          SettingsService.setProperty('playerID', player.playerID);
          SettingsService.setProperty('isAdmin', player.admin);
          // Nav to leaderboard
          $ionicHistory.goBack();
        }
      }
  })();