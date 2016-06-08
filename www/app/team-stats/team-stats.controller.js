(function()
{
  angular
    .module('teamStats')
    .controller('TeamStatsController', TeamStatsController);

  TeamStatsController.$inject = ['$scope', 'FooseyService', 'SettingsService'];

  function TeamStatsController($scope, FooseyService, SettingsService)
  {
    setUpCharts();   

    // set up the charts for the scorecard page
    function setUpCharts()
    {
      // send to login screen if they haven't logged in yet
    if (!SettingsService.loggedIn) SettingsService.logOut();

      $scope.charts = [];
      $scope.subtitle = 'This is mock data till I fix it';

      // FooseyService.getAllGames().then(function successCallback(response)
      // {
        $scope.days = [
          {
            day: 'Sunday',
            count: 11
          },
          {
            day: 'Monday',
            count: 238
          },
          {
            day: 'Tuesday',
            count: 324
          },
          {
            day: 'Wednesday',
            count:282
          },
          {
            day: 'Thursday',
            count: 361
          },
          {
            day: 'Friday',
            count: 324
          },
          {
            day: 'Saturday',
            count: 22
          }
        ];

        $scope.data = [];
        for (var i = 0; i < $scope.days.length; i++)
        {
          $scope.data.push({
            name: $scope.days[i].day,
            y: $scope.days[i].count
          });
        }
        doChart();
      // });
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
          text: $scope.subtitle
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
})();