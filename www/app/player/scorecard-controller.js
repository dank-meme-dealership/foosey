angular.module('player')
	.controller('ScorecardController', function($scope, $stateParams, localStorage)
	{
		// set up the player
		$scope.player = getPlayer($stateParams.player);

		// mock data to be deleted
		var data = [1200, 1208, 1227, 1225, 1231, 1235, 1235, 1236, 1242, 1226, 1251, 1256, 1267, 1264, 1261, 1272];
		var dates = ["7/12", "7/15", "7/15", "7/16", "7/23", "7/29", "8/2", "8/19", "8/21", "8/25", "9/13", "9/21", "9/23", "10/3", "10/4", "11/17"];

		// set up charts
		setUpCharts();

		// get the player information
		function getPlayer(name)
		{
			return {
				name: name,
				elo: getElo(name),
				avg: getAvg(name),
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

		// get the average score for this player from local storage
		function getAvg(name)
		{
			var avgs = localStorage.getObject('avgs');
			var index = _.indexOf(_.pluck(avgs, 'name'), name);

			return avgs[index].avg;
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

			// Set up ELO Rating chart
			$scope.charts.push(getEloChartOptions());

			// Set up Avg Score chart
			$scope.charts.push(getAvgChartOptions());

			// Set up Win Percent chart
			$scope.charts.push(getPercentChartOptions());
		}

		// define options for the ELO Rating chart
		function getEloChartOptions()
		{
			return {
				title: 'ELO Rating',
				subtitle: 'This is placeholder data for now',
				yAxis: 'ELO',
				class: 'elo',
				data: data,
				dates: dates
			};
		}

		// define options for the Average Score chart
		function getAvgChartOptions()
		{
			return {
				title: 'Average Score Per Game',
				subtitle: 'This is placeholder data for now',
				yAxis: 'Score',
				class: 'avg',
				data: data,
				dates: dates
			};
		}

		// define options for the Win Percentage chart
		function getPercentChartOptions()
		{
			return {
				title: 'Percent Games Won',
				subtitle: 'This is placeholder data for now',
				yAxis: 'Percent',
				class: 'percent',
				data: data,
				dates: dates
			};
		}
	});