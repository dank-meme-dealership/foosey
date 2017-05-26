(function () {
  angular
    .module('scorecard')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) {
    $stateProvider
      .state('app.scorecard',
        {
          url: '/scorecard',
          views: {
            scorecard: {
              controller: 'ScorecardController',
              templateUrl: 'js/scorecard/scorecard.html'
            }
          }
        })
      .state('app.scorecard-game-detail',
        {
          url: '/scorecard/game-detail/:gameID',
          views: {
            scorecard: {
              controller: 'GameDetailController',
              templateUrl: 'js/game-detail/game-detail.html'
            }
          }
        })
      .state('app.scorecard-game-detail-edit-game',
        {
          url: '/scorecard/game-detail/:gameID/edit',
          views: {
            scorecard: {
              controller: 'AddGameController',
              templateUrl: 'js/add-game/add-game.html'
            }
          }
        });
  }
})();