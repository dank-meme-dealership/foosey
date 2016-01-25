// set up foosey module
angular
  .module('foosey', [
    'ionic', 
    'ionic.utils',

    'ngIOS9UIWebViewPatch',

    'addGame',
    'chart',
    'history',
    'leaderboard',
    'player',
    'settings',
    'teamStats'
  ])

  // This establishes a few settings for Ionic
  .run(function($ionicPlatform) 
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
  });
