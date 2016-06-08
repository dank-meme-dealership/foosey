(function()
{
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', '$state', '$ionicModal', '$ionicViewService', '$ionicPopup', 'FooseyService', 'SettingsService'];

  function SettingsController($scope, $state, $ionicModal, $ionicViewService, $ionicPopup, FooseyService, SettingsService)
  {
    // send to login screen if they haven't logged in yet
    if (!SettingsService.loggedIn) SettingsService.logOut();
    
  	$scope.settings = SettingsService;
    $scope.players = [];
    $scope.playerSelections = [];
    $scope.player = [];
    $scope.player.selected = SettingsService.playerID;
  	$scope.tapped = 0;

  	$scope.tap = tap;
    $scope.openModal = openModal;
    $scope.addPlayer = addPlayer;
    $scope.editPlayer = editPlayer;
    $scope.removePlayer = removePlayer;

    loadPlayers();

    $ionicModal.fromTemplateUrl('app/settings/settings-user.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.$watch('player.selected', function(player)
    {
      if (_.isUndefined(player)) return;
      SettingsService.setPlayer(player);
    });

    function loadPlayers()
    {
      // load from server
      FooseyService.getAllPlayers(false).then(
        function (players)
        { 
          $scope.players = players.sort(function(a, b){
            return a.displayName.localeCompare(b.displayName);
          });
          // filter the player selections that you can choose to just the active players
          $scope.playerSelections = _.filter($scope.players, function(player){ return player.active });
          // $scope.player.selected = _.filter($scope.playerSelections, function(player){ return player.playerID === SettingsService.playerID });
        });
    }

  	function tap()
  	{
  		$scope.tapped++;
  	}

    function openModal(player) 
    {
      $scope.player = _.clone(player);
      $scope.modal.show();
    };

    function addPlayer(player)
    {
      FooseyService.addPlayer(
      {
        displayName: !player.displayName ? '' : player.displayName,
        slackName: !player.slackName ? '' : player.slackName,
        admin: _.isUndefined(player.admin) ? false : player.admin,
        active: _.isUndefined(player.admin) ? false : player.active
      }).then(reload);
      $scope.modal.hide();
    }

    function editPlayer(player)
    {
      FooseyService.editPlayer(
      {
        id: player.playerID,
        displayName: !player.displayName ? '' : player.displayName,
        slackName: !player.slackName ? '' : player.slackName,
        admin: player.admin,
        active: player.active
      }).then(reload);
      $scope.modal.hide();
    }

    function removePlayer(playerID)
    {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Remove This Player',
        template: 'Are you sure you want to remove this player? This cannot be undone.'
      });

      // if yes, delete the last game
      confirmPopup.then(function(positive) {
        if(positive) {
          FooseyService.removePlayer(playerID).then(reload);
          $scope.modal.hide();
        }
      });
    }

    function reload(response)
    {
      loadPlayers();
    }

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
  }
})();