(function () {
  angular
    .module('foosey.leagues')
    .controller('ManageLeaguesController', ManageLeaguesController);

  function ManageLeaguesController($scope, SettingsService) {
    $scope.settings = SettingsService;

    // load on entering view
    $scope.$on('$ionicView.beforeEnter', function () {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
    });
  }

})();
