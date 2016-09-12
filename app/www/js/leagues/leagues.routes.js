(function()
{
  angular
    .module('leagues')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.settings-switch-leagues',
      {
        url: '/settings/switch-leagues',
        views: {
          settings: {
            controller: 'SwitchLeaguesController',
            templateUrl: 'js/leagues/switch-leagues.html'
          }
        }
      });
  }
})();