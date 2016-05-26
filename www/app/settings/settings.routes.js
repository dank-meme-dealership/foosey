(function()
{
  angular
    .module('settings')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.settings',
      {
        url: '/settings',
        views: {
          menuContent: {
            controller: 'SettingsController',
            templateUrl: 'app/settings/settings.html'
          }
        }
      });
  }
})();