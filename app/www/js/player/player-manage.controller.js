(function()
{
  angular
    .module('player')
    .controller('PlayerManageController', PlayerManageController);

  PlayerManageController.$inject = ['$scope', '$ionicModal', '$ionicPopup', 'FooseyService', 'SettingsService', 'BadgesService'];

  function PlayerManageController($scope, $ionicModal, $ionicPopup, FooseyService, SettingsService, BadgesService)
  {
    $scope.activePlayers = undefined;
    $scope.inactivePlayers = undefined;

    $scope.openModal = openModal;
    $scope.addPlayer = addPlayer;
    $scope.loadPlayers = loadPlayers;

    $ionicModal.fromTemplateUrl('js/player/player-edit.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      BadgesService.updateBadges();
      loadPlayers();
    });

    function loadPlayers(response)
    {
      if (response && response.data.error)
      {
        $ionicPopup.alert({
          title: 'Duplicate Player',
          template: '<div class="text-center">' + response.data.message + '</div>'
        });
      }

      // load from server
      FooseyService.getAllPlayers(false).then(
        function onSuccess(players)
        {
          var allPlayers = players.sort(function(a, b){
            return a.displayName.localeCompare(b.displayName);
          });
          // filter the player selections that you can choose to just the active players
          $scope.activePlayers = _.filter(allPlayers, function(player){ return player.active });
          $scope.inactivePlayers = _.filter(allPlayers, function(player){ return !player.active });
        }, function errorCallback(response)
        {
          console.log(response);
          $scope.activePlayers = [];
          $scope.inactivePlayers = [];
        });
    }

    function openModal() 
    {
      $scope.player = {};
      $scope.modal.show();
    };

    function addPlayer(player)
    {
      FooseyService.addPlayer(
      {
        displayName: !player.displayName ? '' : player.displayName,
        slackName: !player.slackName ? '' : player.slackName,
        admin: _.isUndefined(player.admin) ? false : player.admin,
        active: true
      }).then(loadPlayers);
      $scope.modal.hide();
    }
  }
})();