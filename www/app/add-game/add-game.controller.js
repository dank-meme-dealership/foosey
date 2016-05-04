angular
	.module('addGame')
	.controller('AddGameController', AddGameController);

function AddGameController($scope, $rootScope, $ionicScrollDelegate, localStorage, FooseyService)
{
	// Set up the types of games you can play
	$scope.gameTypes = [
		{
			name: "1 vs. 1",
			teams: 2,
			playersPerTeam: 1
		},
		{
			name: "2 vs. 2",
			teams: 2,
			playersPerTeam: 2
		},
		{
			name: "Trips",
			teams: 3,
			playersPerTeam: 1
		}
	];

	$scope.reset = reset;

	// initialize page
	reset();
	$scope.scores = new Array(11);

	// function to select game
	$scope.gameSelect = function(type)
	{
		$scope.type = _.clone(type);
		$scope.playersSelected = [];
		changeState("player-select", "Select Players");
	};

	// function to select player
	$scope.playerSelect = function(player)
	{
		// don't allow selected players to be selected again
		if (player.selected) return;

		// add player to this team
		player.selected = true;
		$scope.playersSelected.push(player.name);

		// if we have selected all players for the team, select the score
		if ($scope.playersSelected.length === $scope.type.playersPerTeam)
		{
			changeState("score-select", "Select Score");
		}
	};

	// function to select score
	$scope.scoreSelect = function(score)
	{
		appendToCommand($scope.playersSelected, score);

		$scope.game.push({
			players: $scope.playersSelected,
			score: score
		});

		$scope.playersSelected = [];
		$scope.type.teams--;
		
		// if we have scores for every team, go to confirm
		if ($scope.type.teams === 0)
		{
			changeState("confirm", "Confirm");
		}
		else
		{
			changeState("player-select", "Select Players");
		}
	};

	// add the game
	$scope.submit = function()
	{
		$scope.state = "saving";
		changeState("saving", null);
		$scope.saveStatus = "saving";
		console.log($scope.command);
		FooseyService.addGame($scope.command).then(function successCallback(response)
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

	// function to build the add command out for foosey
	function appendToCommand(players, score)
	{
		for (var i = 0; i < $scope.type.playersPerTeam; i++)
		{
			$scope.command += players[i] + " " + score + " ";
		}
	}

	// reset the game
	function reset()
	{
		changeState("game-select", "Select the Type of Game");
		$scope.command = "";
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
		FooseyService.players().then(function (response)
    	{ 
	    	// only overwrite if they haven't selected one yet
	    	if (noneSelected())
	    	{
	    		$scope.players = response.data.players;
	    		$scope.players.sort(function(a, b){
	    			return a.name.localeCompare(b.name);
	    		});
	    	}

	    	localStorage.setObject('players', response.data.players);
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

	function changeState(state, title)
	{
		if (state) $scope.state = state;
		if (title) $scope.title = title;
		$ionicScrollDelegate.scrollTop();
	}

	$rootScope.$on("$stateChangeSuccess", function() {
	  reset();
	});

}