(function()
{
  angular
    .module('foosey')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider)
  {
    $stateProvider
      .state('app', {
        url         : '/app',
        abstract    : true,
        controller  : 'TabsController',
        templateUrl : 'js/tabs/tabs.html'
      });
  }
})();