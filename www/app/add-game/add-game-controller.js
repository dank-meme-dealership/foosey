angular.module('addGame', [])
	.controller('AddGameController', function($scope, $rootScope, localStorage, FooseyService)
	{
		// initialize page
		reset();
		$scope.scores = new Array(11); // 0-10
		$scope.reset = reset;

		// Set up the types of games you cal play
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
			$scope.playersSelected.push(player);

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
			FooseyService.addGame($scope.command).then(function successCallback(response)
			{
				$scope.attachments = response.data.attachments;
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
				$scope.command += players[i].name + " " + score + " ";
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
			$scope.attachments = undefined;
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

	});