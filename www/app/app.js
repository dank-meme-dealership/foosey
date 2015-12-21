// set up foosey module
angular.module('foosey', ['ionic'])
    
    .filter('capitalize', function() {
      return function(input, scope) {
        if (input!=null)
        input = input.toLowerCase();
        return input.substring(0,1).toUpperCase()+input.substring(1);
      }
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
    })

    .config(function($ionicConfigProvider) 
    {
      $ionicConfigProvider.views.transition('none');
    });
