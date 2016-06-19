(function()
{
	angular
		.module('settings')
		.factory('SettingsService', SettingsService);

	SettingsService.$inject = ['$state', '$ionicHistory', 'localStorage'];

	function SettingsService($state, $ionicHistory, localStorage)
	{
		var service = {
			isAdmin						: localStorage.getObject('isAdmin') === 1,
			showElo						: localStorage.getObject('showElo') !== 0,
			showRelTimes			: localStorage.getObject('showRelTimes') !== 0,
			loggedIn					: localStorage.getObject('loggedIn') === 1,
			logIn 						: logIn,
			logOut						: logOut,
			playerID					: getPlayer(),
			setPlayer					: setPlayer,
			toggleShowElo 		: toggleShowElo,
			toggleShowRelTimes: toggleShowRelTimes
		}

		return service;

		function getPlayer()
		{
			var playerID = localStorage.getObject('playerID');
			return _.isNumber(playerID) ? playerID : undefined;
		}

		function logIn(admin)
		{
			if (admin) 
			{
				service.isAdmin = true;
				localStorage.setObject('isAdmin', 1);
			}

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
			service.showRelTimes = true;
			service.isAdmin = false;

      localStorage.setObject('loggedIn', 0);
      localStorage.setObject('playerID', undefined);
      localStorage.setObject('showElo', undefined);
      localStorage.setObject('showRelTimes', undefined);
      localStorage.setObject('isAdmin', undefined);

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

		function toggleShowRelTimes()
		{
			service.showRelTimes = localStorage.getObject('showRelTimes') === 0;
			localStorage.setObject('showRelTimes', service.showRelTimes ? 1 : 0);
		}
	}
})();