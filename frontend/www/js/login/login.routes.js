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
      });
  }
})();