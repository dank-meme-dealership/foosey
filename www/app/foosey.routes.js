(function()
{
  angular
    .module('foosey')
    .config(config);

  function config($stateProvider, $urlRouterProvider, SettingsServiceProvider) 
  { 
    // If they're logged in, default to leaderboard
    if (SettingsServiceProvider.$get().loggedIn)
    {
      $urlRouterProvider.otherwise('/app/leaderboard');
    } 
    // Otherwise, send them to the login page
    else 
    {
      $urlRouterProvider.otherwise('/login');   
    }
  }
})();