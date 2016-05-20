(function()
{
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', '$state', '$ionicModal', '$ionicViewService', 'FooseyService', 'SettingsService'];

  function SettingsController($scope, $state, $ionicModal, $ionicViewService, FooseyService, SettingsService)
  {
  	$scope.settings = SettingsService;
    $scope.players = [];
  	$scope.tapped = 0;

  	$scope.tap = tap;
    $scope.openModal = openModal;
    $scope.editPlayer = editPlayer;
    $scope.logOut = logOut;

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
        displayName: !player.displayName ? '' : player.displayName,
        slackName: !player.slackName ? '' : player.slackName,
        admin: player.admin,
        active: player.active
      }).then(
        function(response)
        {
          loadPlayers();
        }
      );
      $scope.modal.hide();
    }

    function logOut()
    {
      $ionicViewService.nextViewOptions({
        disableBack: true
      });

      $state.go('login');
    }

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
  }
})();