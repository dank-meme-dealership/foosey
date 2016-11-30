(function()
{
	angular
		.module('scorecard')
		.controller('ScorecardController', ScorecardController);

	ScorecardController.$inject = ['$scope', '$state', '$stateParams', '$ionicPopup', '$ionicScrollDelegate', 'scorecardInfo', 'localStorage', 'FooseyService', 'SettingsService', 'BadgesService'];

	function ScorecardController($scope, $state, $stateParams, $ionicPopup, $ionicScrollDelegate, scorecardInfo, localStorage, FooseyService, SettingsService, BadgesService)
	{
    var chartBeToggled = false;

		$scope.chart = undefined;
		$scope.settings = SettingsService;
		$scope.badges = BadgesService;
		$scope.scorecardInfo = scorecardInfo;
		$scope.recentGames = undefined;
		$scope.player = undefined;
		$scope.error = false;
    $scope.showBreakdown = false;

		$scope.info = info;
    $scope.refresh = refresh;
    $scope.toggleBreakdown = toggleBreakdown;
    $scope.toggleChart = toggleChart;
    $scope.compare = compare;

		// load on entering view 
    $scope.$on('$ionicView.beforeEnter', refresh);

    function refresh()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
      if (SettingsService.showBadges) BadgesService.updateBadges();
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
      $scope.player = localStorage.getObject('player' + $scope.playerID);
			// set up the player
			FooseyService.getPlayer($scope.playerID).then(
				function(response){
					$scope.player = response.data;
          localStorage.setObject('player' + $scope.playerID, $scope.player);
      		if (SettingsService.showElo) setUpChart();
				});
    }

    function setUpRecentGames()
    {
      $scope.recentGames = localStorage.getObject('scorecardRecentGames' + $scope.playerID);
    	// set up the player
			FooseyService.getPlayerGames($scope.playerID, SettingsService.recentGames).then(
				function(response){
					$scope.recentGames = response.data;
          localStorage.setObject('scorecardRecentGames' + $scope.playerID, $scope.recentGames);
          setUpBreakdown();
				});
    }

    function setUpBreakdown()
    {
      var breakdown = [];
      var totalDamage = 0;

      _.each($scope.recentGames, function(game)
      {
        // the first team is always the winner so add a win to whoever it's for
        var winner = _.includes(_.map(game.teams[0].players, 'playerID'), parseInt($scope.playerID));
        var enemies = game.teams[winner ? 1 : 0].players;
        var damage = parseFloat(game.teams[winner ? 0 : 1].delta) / enemies.length;
        _.each(enemies, function(enemy)
        {
          var existing = _.find(breakdown, ['playerID', enemy.playerID]);
          if (existing)
          {
            existing.elo += damage;
            existing.games.push(game);
          }
          else
          {
            breakdown.push({
              name: enemy.displayName,
              playerID: enemy.playerID,
              elo: damage,
              games: [game]
            });
          }
          // increment total damage
          totalDamage += damage;
        });
      });

      breakdown = _.sortBy(breakdown, 'elo').reverse();

      $scope.totalDamage = totalDamage;
      $scope.breakdown = breakdown;
    }

		// set up the charts for the scorecard page
		function setUpChart(toggled)
		{
			var subtitle = 'Data from ';
      var recentGames = toggled ? undefined : SettingsService.recentGames;

			if ($scope.settings.showElo)
			{
				FooseyService.getEloHistory($scope.playerID, recentGames).then(
					function successCallback(response)
					{
						$scope.error = false;

						// Get chart data
						var chartData = response.data;
						subtitle += toggled ? 'all time' : 'the last ' + chartData.length + (chartData.length === 1 ? ' game' : ' games');

						// Set up ELO Rating chart
						$scope.chart = getEloChartOptions(_.map(chartData, 'elo').reverse(), _.map(chartData, 'date').reverse(), subtitle);
					}, function errorCallback(response)
					{
						$scope.error = true;
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
          title: undefined        
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

    // toggle showing the breakdown of elo
    function toggleBreakdown()
    {
      $scope.showBreakdown = !$scope.showBreakdown;
      $('.elo-breakdown').slideToggle();

      // scroll to the top when collapsing the breakdown
      if (!$scope.showBreakdown) $ionicScrollDelegate.scrollTop(true);
    }

    // toggle chart between your preference and all time
    // or 1,000,000 games if you've played that much. If
    // you have, you may have a problem
    function toggleChart()
    {
      chartBeToggled = !chartBeToggled;
      setUpChart(chartBeToggled);
    }

    function compare()
    {
      location.href = '#/app/leaderboard/scorecard/' + $scope.player.playerID + '/compare'
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