(function () {
  angular
    .module('player')
    .controller('PlayerManageController', PlayerManageController);

  PlayerManageController.$inject = ['$scope', '$ionicModal', '$ionicPopup', 'FooseyService', 'SettingsService', 'BadgesService', 'PlayerService'];

  function PlayerManageController($scope, $ionicModal, $ionicPopup, FooseyService, SettingsService, BadgesService, PlayerService) {
    $scope.players = PlayerService;

    $scope.openModal = openModal;
    $scope.addPlayer = addPlayer;
    $scope.loadPlayers = loadPlayers;

    // load up add/edit player modal
    $ionicModal.fromTemplateUrl('js/player/player-edit.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function () {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
      BadgesService.updateBadges();
      loadPlayers();
    });

    function loadPlayers(response) {
      // error means a player with the same displayName already exists
      // display an error message
      if (response && response.data.error) {
        $ionicPopup.alert({
          title: 'Duplicate Player',
          template: '<div class="text-center">' + response.data.message + '</div>'
        });
      }

      // load from server
      PlayerService.updatePlayers();
    }

    function openModal() {
      $scope.player = {};
      $scope.modal.show();
    }

    function addPlayer(player) {
      FooseyService.addPlayer(
        {
          displayName: !player.displayName ? '' : player.displayName,
          admin: _.isUndefined(player.admin) ? false : player.admin,
          active: true
        }).then(loadPlayers);
      $scope.modal.hide();
    }
  }
})();