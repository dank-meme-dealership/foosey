(function()
{
  angular
    .module('foosey')
    .config(config);

  function config($urlRouterProvider, $ionicPopupProvider, SettingsServiceProvider, FooseyServiceProvider) 
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

    // Ask about Android APK
    if (ionic.Platform.isAndroid() && window.location.hostname === 'foosey.futbol') {
      $ionicPopupProvider.$get().confirm({
        title: 'Download Foosey APK',
        template: '<div class="text-center">We have a native version of this application available for Android. Do you want to download it now?</div>',
        buttons: [
          { text: 'Not Now' },
          { 
            text: 'Sure', 
            onTap: function() { window.location.replace('http://api.foosey.futbol/android'); }
          }
        ]
      });
    }

    // Check version and info
    FooseyServiceProvider.$get().info().then(
      function(response)
      {
        if (response.data.version > SettingsServiceProvider.$get().version)
        {
          var updateText = '';

          // Decide what to tell the user
          if (ionic.Platform.isIOS()) updateText = response.data.updateIOS;
          else if (ionic.Platform.isAndroid()) updateText = response.data.updateAndroid;
          else return; // anything other than iOS or Android not supported

          $ionicPopupProvider.$get().alert({
            template: '<div class="text-center">' + updateText + '</div>',
            title: 'Update Available'
          });
        }
      });
  }
})();
