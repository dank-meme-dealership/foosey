angular.module('foosey')
  .config(function ($stateProvider, $urlRouterProvider) 
  {
    $stateProvider
      .state('leaderboard', 
      {
        controller: 'LeaderboardController',
        templateUrl: 'app/leaderboard/leaderboard.html',
        url: '/'
      })

      .state('settings',
      {
        controller: 'SettingsController',
        templateUrl: 'app/settings/settings.html',
        url: '/settings'
      })
      
    // If none of the above states are matched, use this as the fallback.
    $urlRouterProvider.otherwise('/');
  });
