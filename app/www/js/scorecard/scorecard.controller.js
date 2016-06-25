(function()
{
	angular
		.module('scorecard')
		.controller('ScorecardController', ScorecardController);

	ScorecardController.$inject = ['$scope', '$stateParams', '$ionicPopup', 'scorecardInfo', 'FooseyService', 'SettingsService', 'BadgesService'];

	function ScorecardController($scope, $stateParams, $ionicPopup, scorecardInfo, FooseyService, SettingsService, BadgesService)
	{
		$scope.chart = undefined;
    $scope.empty = false;
		$scope.settings = SettingsService;
		$scope.badges = BadgesService;
		$scope.scorecardInfo = scorecardInfo;
		$scope.recentGames = undefined;
		$scope.player = undefined;
		$scope.error = false;
    $scope.loading = false;

		$scope.info = info;
    $scope.refresh = refresh;

		// load on entering view 
    $scope.$on('$ionicView.beforeEnter', refresh);

    function refresh()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      $scope.loading = true;
      BadgesService.updateBadges();
      setUpPlayer();
      setUpRecentGames();
      $scope.$broadcast('scroll.refreshComplete');
    }

    function setUpPlayer()
    {
			// set up the player
			FooseyService.getPlayer($stateParams.playerID).then(
				function(response){
					$scope.player = response.data;
      		setUpChart();
				});
    }

    function setUpRecentGames()
    {
    	// set up the player
			FooseyService.getPlayerGames($stateParams.playerID, SettingsService.recentGames).then(
				function(response){
					$scope.recentGames = response.data;
				});
    }

		// set up the charts for the scorecard page
		function setUpChart()
		{
			var subtitle = 'Data from the last ';

			if ($scope.settings.showElo)
			{
				FooseyService.getEloHistory($stateParams.playerID, SettingsService.eloChartGames).then(
					function successCallback(response)
					{
						$scope.error = false;

						// Get chart data
						var chartData = response.data;
						subtitle += chartData.length + (chartData.length === 1 ? ' game' : ' games');

						// Set up ELO Rating chart
						$scope.chart = getEloChartOptions(_.map(chartData, 'elo').reverse(), _.map(chartData, 'date').reverse(), subtitle);
            $scope.loading = false;
					}, function errorCallback(response)
					{
						$scope.error = true;
            $scope.loading = false;
					});
			}
		}

		// define options for the ELO Rating chart
		function getEloChartOptions(data, dates, subtitle)
		{
      $scope.empty = data.length === 0;
			return {
        options: { colors: ['#7CB5EC'] },
        title: {
          text: undefined
        },
        subtitle: {
          text: subtitle
        },
        xAxis: {
          categories: dates
        },
        yAxis: {
          title: {
            text: 'Elo'
          }
        },
        series: [{
          name: 'Elo',
          enableMouseTracking: false,
          marker: {
            symbol: 'diamond'
          },
          data: data,
          showInLegend: false
        }],
        size: {
			  	height: 250
			  }
      }
		}

		function info(title, message)
		{
			$ionicPopup.alert({
				title: title,
        template: '<div style="text-align: center;">' + message + '</div>'
      });
		}
	}
})();