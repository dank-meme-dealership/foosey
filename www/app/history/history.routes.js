(function()
{
  angular
    .module('history')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.history',
      {
        url: '/history',
        views: {
          menuContent: {
            controller: 'HistoryController',
            templateUrl: 'app/history/history.html'
          }
        }
      });
  }
})();