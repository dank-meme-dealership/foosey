angular.module('foosey')
  .config(function ($stateProvider, $urlRouterProvider) 
  {
    $stateProvider
      .state('add-game',
      {
        controller: 'AddGameController',
        templateUrl: 'app/add-game/add-game.html',
        url: '/add-game'
      })
      .state('history',
      {
        controller: 'HistoryController',
        templateUrl: 'app/history/history.html',
        url: '/history'
      })
      .state('leaderboard', 
      {
        controller: 'LeaderboardController',
        templateUrl: 'app/leaderboard/leaderboard.html',
        url: '/leaderboard'
      })
      .state('settings',
      {
        controller: 'SettingsController',
        templateUrl: 'app/settings/settings.html',
        url: '/settings'
      });
      
    // If none of the above states are matched, use this as the fallback.
    $urlRouterProvider.otherwise('/leaderboard');
  });
