(function()
{
	angular
		.module('scorecard')
		.controller('ScorecardController', ScorecardController);

	ScorecardController.$inject = ['$scope', '$state', '$stateParams', '$ionicPopup', 'localStorage', 'scorecardInfo', 'FooseyService', 'SettingsService'];

	function ScorecardController($scope, $state, $stateParams, $ionicPopup, localStorage, scorecardInfo, FooseyService, SettingsService)
	{
		$scope.settings = SettingsService;
		$scope.scorecardInfo = scorecardInfo;
		$scope.recentGames = [];
		$scope.player = undefined;
		$scope.error = false;

		$scope.info = info;
		$scope.hardReload = hardReload;

		// load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      setUpPlayer();
      setUpRecentGames();
    });

    function setUpPlayer()
    {
			// set up the player
			FooseyService.getPlayer($stateParams.playerID).then(
				function(response){
					$scope.player = response.data;
      		setUpCharts();
				});
    }

    function setUpRecentGames()
    {
    	// set up the player
			FooseyService.getPlayerGames($stateParams.playerID, 3).then(
				function(response){
					$scope.recentGames = response.data;
				});
    }

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
						$scope.charts.unshift(getEloChartOptions(_.map(chartData, 'elo').reverse(), _.map(chartData, 'date').reverse()));
					}, function errorCallback(response)
					{
						$scope.error = true;
					});
			}
		}

		// define options for the ELO Rating chart
		function getEloChartOptions(data, dates)
		{
			return {
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

		function info(title, message)
		{
			$ionicPopup.alert({
				title: title,
        template: '<div style="text-align: center;">' + message + '</div>'
      });
		}

		function hardReload()
		{
			location.reload();
		}
	}
})();