angular
	.module('addGame')
	.controller('AddGameController', AddGameController);

function AddGameController($scope, $rootScope, localStorage, FooseyService)
{
	// Set up tables you can play on
	$scope.tables = [
		{
			name: "Tornado Table",
			maxScore: 5
		},
		{
			name: "Other Table",
			maxScore: 10
		}
	];
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
	$scope.changeTable = changeTable;

	// initialize page
	reset();

	function changeTable(table)
	{
		$scope.selectedTable = table;
		$scope.scores = new Array(table.maxScore + 1);
	}

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
		$scope.playersSelected.push(player.name);

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
		console.log("Will undo eventually...");
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
		$scope.state = "game-select";
		$scope.title = "Select the Type of Game";
		$scope.command = "";
		$scope.game = [];
		$scope.saveStatus = "";
		$scope.response = undefined;
		changeTable($scope.tables[0]);
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

	$rootScope.$on("$stateChangeSuccess", function() {
	  reset();
	});

}