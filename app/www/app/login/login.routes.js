(function()
{
  angular
    .module('login')
    .config(config);

  function config($stateProvider, $urlRouterProvider) 
  {
    $stateProvider
      .state('login',
      {
        url: '/login',
        controller: 'LoginController',
        templateUrl: 'app/login/login.html'
      });
  }
})();