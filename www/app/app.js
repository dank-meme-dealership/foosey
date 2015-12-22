// set up foosey module
angular.module('foosey', ['ionic', 'ngIOS9UIWebViewPatch'])

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
    })

    .config(function($ionicConfigProvider) 
    {
      $ionicConfigProvider.views.transition('none');
    });
