(function()
{
  angular
    .module('player')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) 
  {
    $stateProvider
      .state('app.scorecard',
      {
        url: '/player/:playerID',
        views: {
          menuContent: {
            controller: 'ScorecardController',
            templateUrl: 'app/player/scorecard.html'
          }
        }
      });
  }
})();