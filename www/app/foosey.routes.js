(function()
{
  angular
    .module('foosey')
    .config(config);

  function config($stateProvider, $urlRouterProvider) 
  {
    $stateProvider
      .state('app.add-game',
      {
        url: '/add-game',
        views: {
          menuContent: {
            controller: 'AddGameController',
            templateUrl: 'app/add-game/add-game.html'
          }
        }
      })
      .state('app.history',
      {
        url: '/history',
        views: {
          menuContent: {
            controller: 'HistoryController',
            templateUrl: 'app/history/history.html'
          }
        }
      })
      .state('app.leaderboard', 
      {
        url: '/leaderboard',
        views: {
          menuContent: {
            controller: 'LeaderboardController',
            templateUrl: 'app/leaderboard/leaderboard.html'
          }
        }
      })
      .state('app.settings',
      {
        url: '/settings',
        views: {
          menuContent: {
            controller: 'SettingsController',
            templateUrl: 'app/settings/settings.html'
          }
        }
      });
      
    // If none of the above states are matched, use this as the fallback.
    $urlRouterProvider.otherwise('/login');
  }
})();