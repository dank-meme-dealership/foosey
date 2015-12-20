angular.module('foosey')
  .config(function ($stateProvider, $urlRouterProvider) 
  {
    $stateProvider
      .state('home', 
      {
        controller: 'FooseyController',
        templateUrl: 'app/home/home.tpl.html',
        url: '/'
      });
      
    // If none of the above states are matched, use this as the fallback.
    $urlRouterProvider.otherwise('/');
  });
