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
			addGameClear			: setting('addGameClear', false),
			addGameFilter			: setting('addGameFilter', false),
			addGameNames			: setting('addGameNames', false),
			addGameScorePicker: setting('addGameScorePicker', false),
			addGameSelect			: setting('addGameSelect', false),
			eloChartGames			: localStorage.getObject('eloChartGames', 30),
			isAdmin						: setting('isAdmin', false),
			league						: localStorage.getObject('league', undefined),
			leagues						: localStorage.getArray('leagues'),
			loggedIn					: userIsLoggedIn(),
			noGamePlayers			: setting('noGamePlayers', true),
			playerID					: localStorage.getObject('playerID', undefined),
			recentGames				: localStorage.getObject('recentGames', 3),
			showBadges				: setting('showBadges', true),
			showElo						: setting('showElo', true),
			showRelTimes			: setting('showRelTimes', true),
			useLocalDb				: setting('useLocalDb', isLocalhost()),
			//Functions
			isLocalhost				: isLocalhost,
			logIn 						: logIn,
			logOut						: logOut,
			reallyLogOut			: reallyLogOut,
			setProperty				: setProperty
		}

		return service;

		function isLocalhost()
    {
      return window.location.hostname === 'localhost';
    }

    function userIsLoggedIn()
    {
    	return _.isInteger(localStorage.getObject('league').leagueID) &&
    				 localStorage.getArray('leagues').length > 0;
    }

		function logIn(league)
		{
			// set the leagueID to localStorage
			setProperty('league', league);
			setProperty('playerID', league.player.playerID);
			setProperty('isAdmin', league.player.admin);
			service.loggedIn = true;
			addLeague(league);

			// Clear the entire history
			$ionicHistory.clearHistory();
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

			// remove the league from local storage
      removeLeague(service.league);
			setProperty('league', undefined);

			// Completely log out player
			service.loggedIn = false;
			setProperty('isAdmin', false);
			setProperty('playerID', undefined);

			// Clear league specific cache
			setProperty('elos', undefined);
			setProperty('playerBadges', undefined);
			setProperty('winRates', undefined);
			setProperty('history', undefined);
			setProperty('players', undefined);

      $state.go('login');
		}

		function addLeague(league)
		{
			if (!_.includes(_.map(service.leagues, 'leagueID'), league.leagueID))
			{
				service.leagues.push(league);
				setProperty('leagues', service.leagues);
			}
		}

		function removeLeague(league)
		{
			var leagueIndex = _.indexOf(_.map(service.leagues, 'leagueID'), league.leagueID);
			if (leagueIndex > -1)
			{
				service.leagues.splice(leagueIndex, 1);
				setProperty('leagues', service.leagues);
			}
		}

		function setProperty(property, value)
		{
			service[property] = value;
			localStorage.setObject(property, value);
		}

		function setting(property, defaultValue)
		{
			var setValue = localStorage.getObject(property);
			return _.isBoolean(setValue) ? setValue : defaultValue;
		}
	}
})();
