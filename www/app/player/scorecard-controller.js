angular.module('player')
	.controller('ScorecardController', function($scope, $stateParams, localStorage)
	{
		var eloHistory = [1200, 1208, 1227, 1225, 1231, 1235, 1235, 1236, 1242, 1226, 1251, 1256, 1267, 1264, 1261, 1272];
		var dates = ["7/12", "7/15", "7/15", "7/16", "7/23", "7/29", "8/2", "8/19", "8/21", "8/25", "9/13", "9/21", "9/23", "10/3", "10/4", "11/17"];

		// Set up elo chart
		$('#elos').highcharts({
        chart: {
            type: 'spline'
        },
        title: {
            text: 'ELO Rating'
        },
        subtitle: {
            text: 'This is placeholder data for now'
        },
        xAxis: {
            categories: dates
        },
        yAxis: {
            title: {
                text: 'ELO'
            }
        },
        plotOptions: {
            spline: {
                marker: {
                    radius: 4,
                    lineColor: '#666666',
                    lineWidth: 1
                }
            }
        },
        series: [{
            name: 'ELO',
            marker: {
                symbol: 'diamond'
            },
            data: eloHistory
        }]
    });

    // Set up avg chart
		$('#avgs').highcharts({
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Average Score Per Game'
        },
        subtitle: {
            text: 'This is placeholder data for now'
        },
        xAxis: {
            categories: dates
        },
        yAxis: {
            title: {
                text: 'Score'
            }
        },
        plotOptions: {
            spline: {
                marker: {
                    radius: 4,
                    lineColor: '#666666',
                    lineWidth: 1
                }
            }
        },
        series: [{
            name: 'Score',
            marker: {
                symbol: 'diamond'
            },
            data: eloHistory
        }]
    });

    // Set up percent chart
		$('#percent').highcharts({
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Percent of Games Won'
        },
        subtitle: {
            text: 'This is placeholder data for now'
        },
        xAxis: {
            categories: dates
        },
        yAxis: {
            title: {
                text: 'Percent'
            }
        },
        plotOptions: {
            spline: {
                marker: {
                    radius: 4,
                    lineColor: '#666666',
                    lineWidth: 1
                }
            }
        },
        series: [{
            name: 'Percent',
            marker: {
                symbol: 'diamond'
            },
            data: eloHistory
        }]
    });
		
		// Remove link
		$("text")[$("text").length -1].remove();

		$scope.playerName = $stateParams.player;
		$scope.player = getPlayer($stateParams.player);

		function getPlayer(name)
		{
			return {
				name: name,
				elo: getElo(name),
				avg: getAvg(name),
				percent: getPercent(name)
			}
		}

		function getElo(name)
		{
			// load from local storage
      var elos = localStorage.getObject('elos');
      var index = _.indexOf(_.pluck(elos, 'name'), name);
      
			return elos[index].elo;
		}

		function getAvg(name)
		{
			var avgs = localStorage.getObject('avgs');
			var index = _.indexOf(_.pluck(avgs, 'name'), name);

			return avgs[index].avg;
		}

		function getPercent(name)
		{
      var percent = localStorage.getObject('percent');
      var index = _.indexOf(_.pluck(percent, 'name'), name);

			return percent[index].percent;
		}
	});