(function()
{
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', '$ionicModal', 'FooseyService', 'SettingsService'];

  function SettingsController($scope, $ionicModal, FooseyService, SettingsService)
  {
  	$scope.settings = SettingsService;
    $scope.players = [];
  	$scope.tapped = 0;

  	$scope.tap = tap;
    $scope.openModal = openModal;
    $scope.editPlayer = editPlayer;

    loadPlayers();

    $ionicModal.fromTemplateUrl('app/settings/settings-user.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    function loadPlayers()
    {
      // load from server
      FooseyService.getAllPlayers(false).then(
        function (players)
        { 
          $scope.players = players;
          $scope.players.sort(function(a, b){
            return a.displayName.localeCompare(b.displayName);
          });
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

    function editPlayer(player)
    {
      FooseyService.editPlayer(
      {
        id: player.playerID,
        displayName: player.displayName,
        slackName: '@none',
        admin: player.admin,
        active: player.active
      });
      $scope.modal.hide();
      loadPlayers();
    }

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
  }
})();