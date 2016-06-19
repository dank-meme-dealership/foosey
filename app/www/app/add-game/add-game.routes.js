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
          menuContent: {
            controller: 'AddGameController',
            templateUrl: 'app/add-game/add-game.html'
          }
        }
      });
  }
})();