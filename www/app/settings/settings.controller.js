(function()
{
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', 'FooseyService', 'SettingsService'];

  function SettingsController($scope, FooseyService, SettingsService)
  {
    // send to login screen if they haven't logged in yet
    if (!SettingsService.loggedIn) SettingsService.logOut();
    
  	$scope.settings = SettingsService;
    $scope.players = [];
    $scope.playerSelections = [];
    $scope.player = {};
    $scope.player.selected = SettingsService.playerID;
  	$scope.tapped = 0;

  	$scope.tap = tap;

    loadPlayers();

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
        });
    }

  	function tap()
  	{
  		$scope.tapped++;
  	}
  }
})();