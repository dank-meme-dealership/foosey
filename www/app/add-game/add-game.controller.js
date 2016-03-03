angular
	.module('addGame')
	.controller('AddGameController', AddGameController);

function AddGameController($scope, $rootScope, gameTypes, localStorage, FooseyService)
{
	$scope.gameTypes = gameTypes
	$scope.reset = reset;
	$scope.playerName = playerName;

	// initialize page
	reset();
	$scope.scores = new Array(11);

	// function to select game
	$scope.gameSelect = function(type)
	{
		$scope.type = _.clone(type);
		$scope.playersSelected = [];
		$scope.state = "player-select";
		$scope.title = "Select Players";
	};

	// function to select player
	$scope.playerSelect = function(player)
	{
		// don't allow selected players to be selected again
		if (player.selected) return;

		// add player to this team
		player.selected = true;
		$scope.playersSelected.push(player.playerID);

		// if we have selected all players for the team, select the score
		if ($scope.playersSelected.length === $scope.type.playersPerTeam)
		{
			$scope.state = "score-select";
			$scope.title = "Select Score";
		}
	};

	// function to select score
	$scope.scoreSelect = function(score)
	{
		$scope.game.push({
			players: $scope.playersSelected,
			score: score
		});

		$scope.playersSelected = [];
		$scope.type.teams--;
		
		// if we have scores for every team, go to confirm
		if ($scope.type.teams === 0)
		{
			$scope.state = "confirm";
			$scope.title = "Confirm";
		}
		else
		{
			$scope.state = "player-select";
			$scope.title = "Select Players";
		}
	};

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

	// undo last game
	$scope.undo = function()
	{
		FooseyService.undo();
		$scope.saveStatus = "removed";
		$scope.response = [];
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
	    	// only overwrite if they haven't selected one yet
	    	if (noneSelected())
	    	{
	    		$scope.players = players;
	    		$scope.players.sort(function(a, b){
	    			return a.displayName.localeCompare(b.displayName);
	    		});
	    	}

	    	localStorage.setObject('players', $scope.players);
	  	});
	}

	// return true if none of the players have been selected yet
	function noneSelected()
	{
		for (var i = 0; i < $scope.players.length; i++)
		{
			if ($scope.players[i].selected) return false;
		}
		return true;
	}

	function playerName(id)
	{
		var name = '';
		_.each($scope.players, function(player)
		{
			if (player.playerID === id) name = player.displayName;
		});
		return name;
	}

	$rootScope.$on("$stateChangeSuccess", function() {
	  reset();
	});

}