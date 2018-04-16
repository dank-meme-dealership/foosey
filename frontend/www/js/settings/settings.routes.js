(function () {
  angular
    .module('settings')
    .config(config);

  config.$inject = ['$stateProvider'];

  function config($stateProvider) {
    $stateProvider
      .state('app.settings', {
        url: '/settings',
        views: {
          settings: {
            controller: 'SettingsController',
            templateUrl: 'js/settings/settings.html'
          }
        }
      })
      .state('app.settings-manage-players', {
        url: '/settings/manage-players',
        views: {
          settings: {
            controller: 'PlayerManageController',
            templateUrl: 'js/player/player-manage.html'
          }
        }
      })
      .state('app.settings-manage-leagues', {
        url: '/settings/manage-leagues',
        views: {
          settings: {
            controller: 'ManageLeaguesController',
            templateUrl: 'js/leagues/manage-leagues.html'
          }
        }
      })
      .state('app.settings-choose-player', {
        url: '/settings/choose-player',
        views: {
          settings: {
            controller: 'SettingsPickPlayerController',
            controllerAs: '$ctrl',
            templateUrl: 'js/login/pick-player.html'
          }
        }
      });
  }
})();