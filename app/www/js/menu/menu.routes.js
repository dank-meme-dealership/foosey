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
        controller  : 'MenuController',
        templateUrl : 'js/menu/menu.html'
      });
  }
})();