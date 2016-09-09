(function()
{
  angular
    .module('foosey')
    .config(config);

  function config($urlRouterProvider, $ionicPopupProvider, SettingsServiceProvider) 
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
    if (ionic.Platform.isAndroid()) {
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
  }
})();
