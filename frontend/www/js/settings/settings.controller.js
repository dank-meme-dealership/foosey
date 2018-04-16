(function () {
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', '$state', 'FooseyService', 'SettingsService', 'PlayerService'];

  function SettingsController($scope, $state, FooseyService, SettingsService, PlayerService) {
    $scope.settings = SettingsService;
    $scope.players = PlayerService;

    $scope.setPlayer = setPlayer;
    $scope.update = update;
    $scope.validate = validate;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function () {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
      $scope.loading = $scope.player === undefined;
      PlayerService.updatePlayers('active').then(function (players){
        $scope.player = _.find(players, {playerID: SettingsService.playerID});
        $scope.loading = false;
      });
    });

    function setPlayer() {
      $state.go('app.settings-choose-player');
    }

    function update() {
      FooseyService.update().then(function (response) {
        alert(response.data.text);
      });
    }

    function validate(property, value) {
      value = parseInt(value);
      SettingsService.setProperty(property, (!_.isInteger(value) || value < 1 ? 1 : value));
    }
  }
})();