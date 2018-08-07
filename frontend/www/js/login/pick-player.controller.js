(function() {
  angular
    .module('login')
    .controller('PickPlayerController', PickPlayerController);

    function PickPlayerController($scope, $state, $ionicHistory, FooseyService, SettingsService) {
      var $ctrl = this;

      $ctrl.loading = true;
      $ctrl.selected = {};

      $ctrl.tapPlayer = tapPlayer;
      $ctrl.logIn = logIn;
      $ctrl.cancel = cancel;

      $scope.$on('$ionicView.afterEnter', function () {
        $ctrl.loading = true;

        // load in the players for this league
        FooseyService.getLeague($state.params.name).then(
          function (response) {
            if (response.data.error) {
              $ionicHistory.nextViewOptions({historyRoot: true});
              $state.go('login');
            }
            else {
              $ctrl.league = response.data;

              FooseyService.getAllPlayers(true, $ctrl.league.leagueID).then(function (response) {
                $ctrl.players = response;
                $ctrl.loading = false;
              }); 
            }
          });
      });

      function tapPlayer(player) {
        $ctrl.selected = player;
      }

      function logIn(player) {
        $ctrl.league.player = $ctrl.selected;
        SettingsService.logIn($ctrl.league);
        // Nav to leaderboard
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $state.go('app.leaderboard');
      }

      function cancel() {
        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          historyRoot: true
        });
        $state.go('login');
      }
    }
})();