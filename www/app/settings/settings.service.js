(function()
{
	angular
		.module('settings')
		.factory('SettingsService', SettingsService);

	SettingsService.$inject = ['$state', '$ionicHistory', 'localStorage'];

	function SettingsService($state, $ionicHistory, localStorage)
	{
		var service = {
			showElo				: localStorage.getObject('showElo') !== 0,
			loggedIn			: localStorage.getObject('loggedIn') === 1,
			logIn 				: logIn,
			logOut				: logOut,
			playerID			: getPlayer(),
			setPlayer			: setPlayer,
			toggleShowElo : toggleShowElo
		}

		return service;

		function getPlayer()
		{
			var playerID = localStorage.getObject('playerID');
			return _.isNumber(playerID) ? playerID : undefined;
		}

		function logIn()
		{
			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			service.loggedIn = true;
			localStorage.setObject('loggedIn', 1);

			$state.go('app.leaderboard');
		}

		function logOut()
		{
			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			service.loggedIn = false;
			service.playerID = undefined;
			service.showElo = true;

      localStorage.setObject('loggedIn', 0);
      localStorage.setObject('playerID', undefined);
      localStorage.setObject('showElo', undefined);

      $state.go('login');
		}

		function setPlayer(playerID)
		{
			service.playerID = playerID;
			localStorage.setObject('playerID', playerID);
		}

		function toggleShowElo()
		{
			service.showElo = localStorage.getObject('showElo') === 0;
			localStorage.setObject('showElo', service.showElo ? 1 : 0);
		}
	}
})();