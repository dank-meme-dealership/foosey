(function()
{
  angular
    .module('scorecard')
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
            templateUrl: 'app/scorecard/scorecard.html'
          }
        }
      });
  }
})();