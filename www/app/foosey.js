(function()
{
  angular
    .module('foosey', [
      'ionic', 
      'ionic.utils',

      'ngIOS9UIWebViewPatch',
      'sc.twemoji',

      'addGame',
      'datepicker',
      'chart',
      'history',
      'leaderboard',
      'login',
      'scorecard',
      'settings',
      'teamStats'
    ])
    .config(config)
    .run(run);

  config.$inject = ['$httpProvider'];

  function config($httpProvider)
  {        
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
  }

  run.$inject = ['$ionicPlatform'];

  // This establishes a few settings for Ionic
  function run($ionicPlatform) 
  {
    $ionicPlatform.ready(function() 
    {
      if(window.cordova && window.cordova.plugins.Keyboard) 
      {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) 
      {
        StatusBar.styleDefault();
      }
    });
  }
})();