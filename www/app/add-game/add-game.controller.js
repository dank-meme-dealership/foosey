angular
	.module('addGame')
	.controller('AddGameController', AddGameController);

function AddGameController($scope, $rootScope, gameTypes, localStorage, FooseyService)
{
	$scope.gameTypes = gameTypes;
	$scope.game = [];
	$scope.gameType = [];
	$scope.reset = reset;

	// initialize page
	reset();
	$scope.scores = new Array(11);

	$scope.$watch('game.type', function(newVal)
	{
		if (!newVal) return;
		console.log(newVal);

		var teams = [];
		for (var i = 0; i < newVal.teams; i++)
		{
			var team = {
				score: undefined,
				players: []
			}
			for (var j = 0; j < newVal.playersPerTeam; j++)
			{
				team.players.push($scope.players[0]);
			}
			teams.push(team);
		}
		$scope.teams = teams;
	});

	// add the game
	$scope.submit = function()
	{
		$scope.state = "saving";
		$scope.saveStatus = "saving";

		// set up game object
		var game = {
			teams: $scope.game
		}

		FooseyService.addGame(game).then(function successCallback(response)
		{
			$scope.response = response.data;
			$scope.saveStatus = "success";
		}, function errorCallback(response)
    {
    	if ($scope.state === "saving")
      	$scope.saveStatus = "failed";
    });
	}

	$scope.getNumber = function(num) {
    return new Array(num);   
	}

	// reset the game
	function reset()
	{
		$scope.state = "game-select";
		$scope.title = "Select the Type of Game";
		$scope.game = [];
		$scope.saveStatus = "";
		$scope.response = undefined;
		getPlayers();
	}

	// get players from server
	function getPlayers()
	{
		// load from local storage
		$scope.players = localStorage.getObject('players');

		// load from server
		FooseyService.getAllPlayers().then(
			function (players)
    	{ 
    		$scope.players = players;
    		$scope.players.sort(function(a, b){
    			return a.displayName.localeCompare(b.displayName);
    		});
    		$scope.players.unshift({displayName: '-'});

	    	localStorage.setObject('players', $scope.players);
	  	});
	}

	$rootScope.$on("$stateChangeSuccess", function() {
	  reset();
	});

}