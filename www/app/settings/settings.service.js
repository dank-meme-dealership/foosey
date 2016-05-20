(function()
{
	angular
		.module('settings')
		.factory('SettingsService', SettingsService);

	SettingsService.$inject = ['localStorage'];

	function SettingsService(localStorage)
	{
		var service = {
			showElo				: localStorage.getObject('showElo') !== 'off',
			toggleShowElo : toggleShowElo
		}

		return service;

		function toggleShowElo()
		{
			service.showElo = localStorage.getObject('showElo') === 'off';
			localStorage.setObject('showElo', service.showElo ? 'on' : 'off');
		}
	}
})();