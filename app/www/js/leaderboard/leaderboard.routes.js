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
          leaderboard: {
            controller: 'LeaderboardController',
            templateUrl: 'js/leaderboard/leaderboard.html'
          }
        }
      })
      .state('app.leaderboard-scorecard', 
      {
        url: '/leaderboard/scorecard/:playerID',
        views: {
          leaderboard: {
            controller: 'ScorecardController',
            templateUrl: 'js/scorecard/scorecard.html'
          }
        }
      })
      .state('app.leaderboard-scorecard-game-detail',
      {
        url: '/leaderboard/scorecard/game-detail/:gameID',
        views: {
          leaderboard: {
            controller: 'GameDetailController',
            templateUrl: 'js/game-detail/game-detail.html'
          }
        }
      })
      .state('app.leaderboard-scorecard-game-detail-edit-game',
      {
        url: '/leaderboard/scorecard/game-detail/:gameID/edit',
        views: {
          leaderboard: {
            controller: 'AddGameController',
            templateUrl: 'js/add-game/add-game.html'
          }
        }
      });
  }
})();