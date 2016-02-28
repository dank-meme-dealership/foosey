angular.module('player')
	.controller('ScorecardController', ScorecardController);

function ScorecardController($scope, $stateParams, localStorage, FooseyService)
{
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
		$scope.subtitle = 'Data from All Time';

		FooseyService.getEloHistory($stateParams.playerID).then(
			function successCallback(response)
			{
				// Get chart data
				var chartData = response.data;

				$scope.dates = _.pluck(chartData, 'date');

				// Set up ELO Rating chart
				$scope.charts.push(getEloChartOptions(_.pluck(chartData, 'elo')));
			});
	}

	// define options for the ELO Rating chart
	function getEloChartOptions(data)
	{
		return {
			title: 'ELO Rating',
			subtitle: $scope.subtitle,
			yAxis: 'ELO',
			class: 'elo',
			data: data,
			dates: $scope.dates
		};
	}

	// define options for the Win Percentage chart
	function getPercentChartOptions(data)
	{
		return {
			title: 'Percent Games Won',
			subtitle: $scope.subtitle,
			yAxis: 'Percent',
			class: 'percent',
			data: data,
			dates: $scope.dates
		};
	}
}