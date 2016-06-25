(function()
{
	angular
		.module('settings')
		.factory('SettingsService', SettingsService);

	SettingsService.$inject = ['$state', '$ionicHistory', 'localStorage'];

	function SettingsService($state, $ionicHistory, localStorage)
	{
		var service = {
			//Properties
			eloChartGames			: localStorage.getObject('eloChartGames', 30),
			isAdmin						: localStorage.getObject('isAdmin', false),
			leagueID					: localStorage.getObject('leagueID', undefined),
			loggedIn					: _.isInteger(localStorage.getObject('leagueID')),
			noGamePlayers			: localStorage.getObject('noGamePlayers', true),
			playerID					: localStorage.getObject('playerID', undefined),
			recentGames				: localStorage.getObject('recentGames', 3),
			showBadges				: localStorage.getObject('showBadges', true),
			showElo						: localStorage.getObject('showElo', false),
			showRelTimes			: localStorage.getObject('showRelTimes', true),
			//Functions
			logIn 						: logIn,
			logOut						: logOut,
			setProperty				: setProperty
		}

		return service;

		function logIn(league)
		{
			// set the leagueID to localStorage
			setProperty('leagueID', league.leagueID);
			setProperty('playerID', league.playerID);
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

			// Set all properties to defaults
			service.loggedIn = false;
			setProperty('eloChartGames', 30);
			setProperty('isAdmin', false);
			setProperty('noGamePlayers', true);
			setProperty('playerID', undefined);
			setProperty('recentGames', 3);
			setProperty('showBadges', true);
			setProperty('showElo', false);
			setProperty('showRelTimes', true);

      $state.go('login');
		}

		function setProperty(property, value)
		{
			service[property] = value;
			localStorage.setObject(property, value);
		}
	}
})();