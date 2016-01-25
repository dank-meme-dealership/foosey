angular
  .module('teamStats')
	.config(config);

function config($stateProvider) 
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
}