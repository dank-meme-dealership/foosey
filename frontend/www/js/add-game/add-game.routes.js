(function()
{
  angular
    .module('addGame')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.add-game',
      {
        url: '/add-game',
        views: {
          games: {
            controller: 'AddGameController',
            templateUrl: 'js/add-game/add-game.html'
          }
        }
      })
      .state('app.add-game-manage-players',
      {
        url: '/add-game/manage-players',
        views: {
          games: {
            controller: 'PlayerManageController',
            templateUrl: 'js/player/player-manage.html'
          }
        }
      });
  }
})();