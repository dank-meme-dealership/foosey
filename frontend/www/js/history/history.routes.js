(function () {
  angular
    .module('history')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) {
    $stateProvider
      .state('app.history', {
        url: '/history',
        views: {
          history: {
            controller: 'HistoryController',
            templateUrl: 'js/history/history.html'
          }
        }
      })
      .state('app.history-game-detail', {
        url: '/history/game-detail/:gameID',
        views: {
          history: {
            controller: 'GameDetailController',
            templateUrl: 'js/game-detail/game-detail.html'
          }
        }
      })
      .state('app.history-game-detail-edit-game', {
        url: '/history/game-detail/:gameID/edit',
        views: {
          history: {
            controller: 'AddGameController',
            templateUrl: 'js/add-game/add-game.html'
          }
        }
      });
  }
})();