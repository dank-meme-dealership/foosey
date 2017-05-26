(function () {
  angular
    .module('login')
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('login',
        {
          url: '/login',
          controller: 'LoginController',
          templateUrl: 'js/login/login.html'
        });
  }
})();