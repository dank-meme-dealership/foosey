(function()
{
  angular
    .module('teamStats')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.team-stats',
      {
        url: '/team-stats',
        views: {
          menuContent: {
            controller: 'TeamStatsController',
            templateUrl: 'js/team-stats/team-stats.html'
          }
        }
      });
  }
})();