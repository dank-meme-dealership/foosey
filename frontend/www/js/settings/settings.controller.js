(function () {
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', 'FooseyService', 'SettingsService', 'PlayerService'];

  function SettingsController($scope, FooseyService, SettingsService, PlayerService) {
    $scope.settings = SettingsService;
    $scope.players = PlayerService;

    $scope.setPlayer = setPlayer;
    $scope.update = update;
    $scope.validate = validate;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function () {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
      PlayerService.updatePlayers();
    });

    function setPlayer(playerID) {
      var player = _.find($scope.players.active, function (player) {
        return player.playerID === playerID;
      });
      SettingsService.setProperty('playerID', playerID);
      SettingsService.setProperty('isAdmin', player.admin);
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