(function()
{
  angular
    .module('gameDetail')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.game-detail',
      {
        url: '/game-detail/:gameID',
        views: {
          menuContent: {
            controller: 'GameDetailController',
            templateUrl: 'app/game-detail/game-detail.html'
          }
        }
      });
  }
})();