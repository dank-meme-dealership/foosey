(function()
{
  angular
    .module('leaderboard')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.leaderboard', 
      {
        url: '/leaderboard',
        views: {
          menuContent: {
            controller: 'LeaderboardController',
            templateUrl: 'app/leaderboard/leaderboard.html'
          }
        }
      });
  }
})();