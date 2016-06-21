(function()
{
  angular
    .module('player')
    .directive('playerList', playerList);

  function playerList()
  {
    var directive = {
      restrict    : 'EA',
      scope       : {
        title : '=',
        list  : '=',
        reload: '='
      },
      controller  : controller,
      templateUrl : 'js/player/player-list.html'
    }

    return directive;
  }

  controller.$inject = ['$scope', '$ionicModal', 'FooseyService'];

  function controller($scope, $ionicModal, FooseyService)
  {
    $scope.openModal = openModal;
    $scope.editPlayer = editPlayer;
    $scope.toggleActive = toggleActive;

    $ionicModal.fromTemplateUrl('js/player/player-edit.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    function openModal(player) 
    {
      $scope.player = _.clone(player);
      $scope.modal.show();
    };

    function editPlayer(player)
    {
      FooseyService.editPlayer(
      {
        id: player.playerID.toString(),
        displayName: !player.displayName ? '' : player.displayName,
        slackName: !player.slackName ? '' : player.slackName,
        admin: player.admin,
        active: player.active
      }).then($scope.reload);
      $scope.modal.hide();
    }

    function toggleActive(player)
    {
      player.active = !player.active;
      editPlayer(player);
    }
  }
})();