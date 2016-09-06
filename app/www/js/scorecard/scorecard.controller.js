(function()
{
	angular
		.module('scorecard')
		.controller('ScorecardController', ScorecardController);

	ScorecardController.$inject = ['$scope', '$state', '$stateParams', '$ionicPopup', 'scorecardInfo', 'FooseyService', 'SettingsService', 'BadgesService'];

	function ScorecardController($scope, $state, $stateParams, $ionicPopup, scorecardInfo, FooseyService, SettingsService, BadgesService)
	{
    var chartBeToggled = false;

		$scope.chart = undefined;
		$scope.settings = SettingsService;
		$scope.badges = BadgesService;
		$scope.scorecardInfo = scorecardInfo;
		$scope.recentGames = undefined;
		$scope.player = undefined;
		$scope.error = false;
    $scope.loading = false;

		$scope.info = info;
    $scope.refresh = refresh;
    $scope.toggleChart = toggleChart;

		// load on entering view 
    $scope.$on('$ionicView.beforeEnter', refresh);

    function refresh()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      if (SettingsService.showBadges) BadgesService.updateBadges();
      $scope.loading = true;
      chartBeToggled = false;
      resetYou();
      setUpPlayer();
      setUpRecentGames();
      $scope.$broadcast('scroll.refreshComplete');
    }

    function resetYou()
    {
      $scope.you = _.isUndefined($stateParams.playerID) || $stateParams.playerID == SettingsService.playerID;
      $scope.playerID = $scope.you ? SettingsService.playerID : $stateParams.playerID;
    }

    function setUpPlayer()
    {
			// set up the player
			FooseyService.getPlayer($scope.playerID).then(
				function(response){
					$scope.player = response.data;
      		if (SettingsService.showElo) setUpChart();
				});
    }

    function setUpRecentGames()
    {
    	// set up the player
			FooseyService.getPlayerGames($scope.playerID, SettingsService.recentGames).then(
				function(response){
					$scope.recentGames = response.data;
				});
    }

		// set up the charts for the scorecard page
		function setUpChart(toggled)
		{
			var subtitle = 'Data from ';
      var eloChartGames = toggled ? undefined : SettingsService.eloChartGames;

			if ($scope.settings.showElo)
			{
				FooseyService.getEloHistory($scope.playerID, eloChartGames).then(
					function successCallback(response)
					{
						$scope.error = false;

						// Get chart data
						var chartData = response.data;
						subtitle += toggled ? 'all time' : 'the last ' + chartData.length + (chartData.length === 1 ? ' game' : ' games');

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

    // toggle chart between your preference and all time
    // or 1,000,000 games if you've played that much. If
    // you have, you may have a problem
    function toggleChart()
    {
      chartBeToggled = !chartBeToggled;
      setUpChart(chartBeToggled);
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