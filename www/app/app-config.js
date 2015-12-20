angular.module('app')
  .config(function ($stateProvider, $urlRouterProvider) 
  {
    $stateProvider
      .state('home', 
      {
        controller: 'HomeCtrl',
        templateUrl: 'app/home/home.tpl.html',
        url: '/'
      });
      
    // If none of the above states are matched, use this as the fallback.
    $urlRouterProvider.otherwise('/');
  });
