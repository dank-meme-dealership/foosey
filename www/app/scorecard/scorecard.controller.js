(function()
{
	angular
		.module('scorecard')
		.controller('ScorecardController', ScorecardController);

	ScorecardController.$inject = ['$scope', '$stateParams', 'localStorage', 'FooseyService', 'SettingsService'];

	function ScorecardController($scope, $stateParams, localStorage, FooseyService, SettingsService)
	{
		// send to login screen if they haven't logged in yet
		if (!SettingsService.loggedIn) SettingsService.logOut();
		
		$scope.error = false;

		$scope.settings = SettingsService;

		_.each(localStorage.getObject('players'), function(player){
			if(player.playerID == $stateParams.playerID)
				$scope.name = player.displayName;
		});


		// set up the player
		FooseyService.getPlayer($stateParams.playerID).then(
			function(response){
				$scope.player = response.data;
			});

		// set up charts
		setUpCharts();

		// set up the charts for the scorecard page
		function setUpCharts()
		{
			$scope.charts = [];
			$scope.subtitle = 'Data from the last ';

			if ($scope.settings.showElo)
			{
				FooseyService.getEloHistory($stateParams.playerID).then(
					function successCallback(response)
					{
						$scope.error = false;

						// Get chart data
						var chartData = response.data;
						$scope.subtitle += chartData.length + ' game';
						if (chartData.length !== 1) $scope.subtitle += 's';

						// Set up ELO Rating chart
						$scope.charts.unshift(getEloChartOptions(_.pluck(chartData, 'elo'), _.pluck(chartData, 'date')));
					}, function errorCallback(response)
					{
						$scope.error = true;
					});
			}
			// FooseyService.getWinRateHistory($stateParams.playerID).then(
			// 	function successCallback(response)
			// 	{
			// 		// Get chart data
			// 		var chartData = response.data;

			// 		// Set up Win Rate chart
			// 		$scope.charts.push(getPercentChartOptions(_.pluck(chartData, 'winRate'), _.pluck(chartData, 'date')));
			// 	});
		}

		// define options for the ELO Rating chart
		function getEloChartOptions(data, dates)
		{
			return {
				title: 'Elo Rating',
				subtitle: $scope.subtitle,
				yAxis: 'Elo',
				class: 'elo',
				data: data,
				dates: dates
			};
		}

		// define options for the Win Percentage chart
		function getPercentChartOptions(data, dates)
		{
			return {
				title: 'Percent Games Won',
				subtitle: $scope.subtitle,
				yAxis: 'Percent',
				class: 'percent',
				data: data,
				dates: dates
			};
		}
	}
})();