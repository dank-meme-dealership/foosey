angular.module('foosey')
  .config(function ($stateProvider)
  {
    $stateProvider
      .state('app', {
        url         : '/app',
        abstract    : true,
        templateUrl : 'app/menu/menu.html'
      });
  });
