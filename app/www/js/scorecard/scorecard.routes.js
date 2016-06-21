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
        url: '/scorecard/:playerID',
        views: {
          menuContent: {
            controller: 'ScorecardController',
            templateUrl: 'js/scorecard/scorecard.html'
          }
        }
      });
  }
})();