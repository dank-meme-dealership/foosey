angular
    .module('teamStats')
	.controller('TeamStatsController', TeamStatsController);

function TeamStatsController($scope, FooseyService)
{

    setUpCharts();   

    // set up the charts for the scorecard page
    function setUpCharts()
    {
        $scope.charts = [];
        $scope.subtitle = 'Data from All Time';

        FooseyService.teamCharts('matt').then(function successCallback(response)
        {
            $scope.days = response.data.charts;

            $scope.data = [];
            for (var i = 0; i < $scope.days.length; i++)
            {
                $scope.data.push({
                    name: $scope.days[i].day,
                    y: $scope.days[i].count
                });
            }
            doChart();
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

    function doChart()
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
                text: 'This is data for all time'
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
                colorByPoint: false,
                data: $scope.data
            }]
        });

        // Remove link
        $("text")[$("text").length -1].remove();
    }
}