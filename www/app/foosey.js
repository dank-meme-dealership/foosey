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

  .config(function ( $httpProvider) {        
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
  })

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
