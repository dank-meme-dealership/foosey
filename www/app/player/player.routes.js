angular
  .module('player')
	.config(config);

function config($stateProvider) 
{
  $stateProvider
    .state('app.scorecard',
    {
      url: '/player/:player',
      views: {
        menuContent: {
          controller: 'ScorecardController',
          templateUrl: 'app/player/scorecard.html'
        }
      }
    });
}