(function () {
  angular
    .module('foosey.leaderboard')
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('app.leaderboard', {
        url: '/leaderboard',
        views: {
          leaderboard: {
            controller: 'LeaderboardController',
            templateUrl: 'js/leaderboard/leaderboard.html'
          }
        }
      })
      .state('app.leaderboard-scorecard', {
        url: '/leaderboard/scorecard/:playerID',
        views: {
          leaderboard: {
            controller: 'ScorecardController',
            templateUrl: 'js/scorecard/scorecard.html'
          }
        }
      })
      .state('app.leaderboard-scorecard-compare', {
        url: '/leaderboard/scorecard/:playerID/compare',
        views: {
          leaderboard: {
            controller: 'CompareController',
            templateUrl: 'js/scorecard/compare/compare.html'
          }
        }
      })
      .state('app.leaderboard-scorecard-compare-game-detail', {
        url: '/leaderboard/scorecard/game-detail/:gameID',
        views: {
          leaderboard: {
            controller: 'GameDetailController',
            templateUrl: 'js/game-detail/game-detail.html'
          }
        }
      })
      .state('app.leaderboard-scorecard-compare-game-detail-edit-game', {
        url: '/leaderboard/scorecard/game-detail/:gameID/edit',
        views: {
          leaderboard: {
            controller: 'AddGameController',
            templateUrl: 'js/add-game/add-game.html'
          }
        }
      })
      .state('app.leaderboard-scorecard-game-detail', {
        url: '/leaderboard/scorecard/game-detail/:gameID',
        views: {
          leaderboard: {
            controller: 'GameDetailController',
            templateUrl: 'js/game-detail/game-detail.html'
          }
        }
      })
      .state('app.leaderboard-scorecard-game-detail-edit-game', {
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
