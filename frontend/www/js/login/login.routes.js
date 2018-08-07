(function () {
  angular
    .module('login')
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('login',{
        url: '/login',
        controller: 'LoginController',
        templateUrl: 'js/login/login.html'
      })
      .state('choose-player', {
        url: '/login/:name',
        controller: 'PickPlayerController',
        controllerAs: '$ctrl',
        templateUrl: 'js/login/pick-player.html'
      })
      .state('redirect', {
        url: '/redirect/:name',
        controller: function($state, $ionicHistory, SettingsService, PlayerService, localStorage) {
          var leagueName = $state.params.name;
          var leagues = localStorage.getArray('leagues');
          var league = _.find(leagues, {leagueName: leagueName});

          // don't animate from this state
          $ionicHistory.nextViewOptions({
            disableAnimate: true
          });

          // if the user is logged in already, send them there
          if (league) {
            SettingsService.logIn(league);
            PlayerService.updatePlayers();
            $state.go('app.leaderboard');
          }
          
          // otherwise, let them choose a player
          else {
            $state.go('choose-player', {name: leagueName});
          }
        }
      });
  }
})();