(function()
{
	angular
		.module('settings')
		.factory('SettingsService', SettingsService);

	SettingsService.$inject = ['$state', '$ionicHistory', 'localStorage'];

	function SettingsService($state, $ionicHistory, localStorage)
	{
		var service = {
			eloChartGames			: localStorage.getObject('eloChartGames', 30),
			isAdmin						: localStorage.getObject('isAdmin') === 1,
			leagueID					: localStorage.getObject('leagueID', undefined),
			loggedIn					: _.isInteger(localStorage.getObject('leagueID')),
			logIn 						: logIn,
			logOut						: logOut,
			playerID					: localStorage.getObject('playerID', undefined),
			recentGames				: localStorage.getObject('recentGames', 3),
			setProperty				: setProperty,
			showElo						: localStorage.getObject('showElo') !== 0,
			showRelTimes			: localStorage.getObject('showRelTimes') !== 0,
			toggleShowElo 		: toggleShowElo,
			toggleShowRelTimes: toggleShowRelTimes
		}

		return service;

		function logIn(league, admin)
		{
			if (admin) 
			{
				service.isAdmin = true;
				localStorage.setObject('isAdmin', 1);
			}

			// set the leagueID to localStorage
			localStorage.setObject('leagueID', league.leagueID);
			service.leagueID = league.leagueID;
			service.loggedIn = true;

			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			$state.go('app.leaderboard');
		}

		function logOut()
		{
			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			service.playerID = undefined;
			service.showElo = true;
			service.showRelTimes = true;
			service.isAdmin = false;
			service.eloChartGames	= 30;
			service.recentGames	= 3;
			service.leagueID = undefined;
			service.loggedIn = false;

      localStorage.setObject('playerID', undefined);
      localStorage.setObject('showElo', undefined);
      localStorage.setObject('showRelTimes', undefined);
      localStorage.setObject('isAdmin', undefined);
      localStorage.setObject('eloChartGames', 30);
      localStorage.setObject('recentGames', 3);
			localStorage.setObject('leagueID', undefined);

      $state.go('login');
		}

		function setProperty(property, value)
		{
			service[property] = value;
			localStorage.setObject(property, value);
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