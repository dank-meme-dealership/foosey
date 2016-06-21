(function()
{
  angular
    .module('player')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.manage-players',
      {
        url: '/manage-players',
        views: {
          menuContent: {
            controller: 'PlayerManageController',
            templateUrl: 'js/player/player-manage.html'
          }
        }
      });
  }
})();