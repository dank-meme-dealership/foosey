angular.module('teamStats')
	.controller('TeamStatsController', function($scope, FooseyService)
	{

		// Create the chart
    $('#container').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'Games Played Per Day'
        },
        subtitle: {
            text: 'This is placeholder data for now'
        },
        xAxis: {
            type: 'category'
        },
        yAxis: {
            title: {
                text: 'Games Played'
            }

        },
        legend: {
            enabled: false
        },
        plotOptions: {
            series: {
                borderWidth: 0,
                dataLabels: {
                    enabled: true
                },
                enableMouseTracking: false
            }
        },
        series: [{
            name: 'Days',
            colorByPoint: true,
            data: [{
                name: 'M',
                y: 127
            }, {
                name: 'T',
                y: 119
            }, {
                name: 'W',
                y: 89
            }, {
                name: 'T',
                y: 75
            }, {
                name: 'F',
                y: 58
            }]
        }]
    });

		// Remove link
		$("text")[$("text").length -1].remove();

		// setUpCharts();	

		// set up the charts for the scorecard page
		function setUpCharts()
		{
			$scope.charts = [];
			$scope.subtitle = 'Data from All Time';

			FooseyService.charts('matt').then(function successCallback(response)
			{
				// Get chart data
				var chartData = response.data;

				$scope.dates = _.pluck(chartData.charts, 'date');

				// Set up ELO Rating chart
				$scope.charts.push(getEloChartOptions(_.pluck(chartData.charts, 'elo')));
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
	});