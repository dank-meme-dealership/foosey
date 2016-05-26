(function()
{
	angular
		.module('settings')
		.factory('SettingsService', SettingsService);

	SettingsService.$inject = ['$state', '$ionicHistory', 'localStorage'];

	function SettingsService($state, $ionicHistory, localStorage)
	{
		var service = {
			showElo				: localStorage.getObject('showElo') !== 'off',
			loggedIn			: localStorage.getObject('loggedInUser') === 1,
			logIn 				: logIn,
			logOut				: logOut,
			toggleShowElo : toggleShowElo
		}

		return service;

		function logIn()
		{
			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			service.loggedIn = true;
			localStorage.setObject('loggedInUser', 1);

			$state.go('app.leaderboard');
		}

		function logOut()
		{
			$ionicHistory.nextViewOptions({
        disableBack: true
      });

			service.loggedIn = false;
      localStorage.setObject('loggedInUser', 0);

      $state.go('login');
		}

		function toggleShowElo()
		{
			service.showElo = localStorage.getObject('showElo') === 'off';
			localStorage.setObject('showElo', service.showElo ? 'on' : 'off');
		}
	}
})();