angular.module('player')
	.controller('ScorecardController', function($scope, $stateParams, localStorage)
	{
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