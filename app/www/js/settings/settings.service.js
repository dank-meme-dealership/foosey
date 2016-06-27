(function()
{
	angular
		.module('settings')
		.factory('SettingsService', SettingsService);

	SettingsService.$inject = ['$state', '$ionicPopup', '$ionicHistory', 'localStorage'];

	function SettingsService($state, $ionicPopup, $ionicHistory, localStorage)
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
			showElo						: localStorage.getObject('showElo', true),
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
			setProperty('playerID', league.player.playerID);
			setProperty('isAdmin', league.player.admin);
			service.loggedIn = true;

			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			$state.go('app.leaderboard');
		}

		function logOut()
		{
			$ionicPopup.confirm({
        title: 'Change League',
        template: '<div class="text-center">Are you sure you want to go back to the login screen?</div>'
      }).then(function(positive) {
        if(positive) {
          reallyLogOut();
        }
      });
		}

		function reallyLogOut()
		{
			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			// Completely log out player
			service.loggedIn = false;
			setProperty('isAdmin', false);
			setProperty('playerID', undefined);

			// Clear league specific cache
			setProperty('elos', undefined);
			setProperty('playerBadges', undefined);
			setProperty('winRates', undefined);
			setProperty('history', undefined);

      $state.go('login');
		}

		function setProperty(property, value)
		{
			service[property] = value;
			localStorage.setObject(property, value);
		}
	}
})();