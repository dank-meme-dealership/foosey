angular.module('teamStats', [])
	.config(function ($stateProvider) 
  {
    $stateProvider
      .state('app.team-stats',
      {
        url: '/team-stats',
        views: {
          menuContent: {
            controller: 'TeamStatsController',
            templateUrl: 'app/team-stats/team-stats.html'
          }
        }
      });
  });