angular.module('player')
	.controller('ScorecardController', ScorecardController);

function ScorecardController($scope, $stateParams, localStorage, FooseyService)
{
	// set up the player
	$scope.player = getPlayer($stateParams.player);

	// set up charts
	setUpCharts();

	// get the player information
	function getPlayer(name)
	{
		return {
			name: name,
			elo: getElo(name),
			percent: getPercent(name)
		}
	}

	// get the elo for this playe from local storage
	function getElo(name)
	{
		// load from local storage
    var elos = localStorage.getObject('elos');
    var index = _.indexOf(_.pluck(elos, 'name'), name);
    
		return elos[index].elo;
	}

	// get the win % for this player from local storage
	function getPercent(name)
	{
    var percent = localStorage.getObject('percent');
    var index = _.indexOf(_.pluck(percent, 'name'), name);

		return percent[index].percent;
	}

	// set up the charts for the scorecard page
	function setUpCharts()
	{
		$scope.charts = [];
		$scope.subtitle = 'Data from All Time';

		FooseyService.charts($scope.player.name).then(function successCallback(response)
		{
			// Get chart data
			var chartData = response.data;

			// mock out filtering the charts by something
			// chartData.charts = _.filter(chartData.charts, function(chart)
			// {
			// 	return true;
			// })

			$scope.dates = _.pluck(chartData.charts, 'date');

			// Set up ELO Rating chart
			$scope.charts.push(getEloChartOptions(_.pluck(chartData.charts, 'elo')));

			// Set up Win Percent chart
			$scope.charts.push(getPercentChartOptions(_.pluck(chartData.charts, 'percent')));
		});
	}

	// define options for the ELO Rating chart
	function getEloChartOptions(data)
	{
		return {
			title: 'Elo Rating',
			subtitle: $scope.subtitle,
			yAxis: 'Elo',
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