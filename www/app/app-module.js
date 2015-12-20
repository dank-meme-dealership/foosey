// This module is the top-level module for the project. In it, we'll
// include sub-modules that we create. Usually, each view get's it's own
// module.
angular.module('app', [
      // List all of the app's dependencies
      'Home',
      'ionic'
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
