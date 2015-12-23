angular.module('foosey')
	.controller('AddGameController', function($scope, FooseyService)
	{
		// initialize page
		reset();
		$scope.scores = new Array(11); // 0-10
		$scope.reset = reset;

		// Load players from local storage
		

		// Grab list of players from server


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
			// ,
			// {
			// 	name: "Other"
			// }
		];

		// function to select game
		$scope.gameSelect = function(type)
		{
			$scope.type = _.clone(type);
			$scope.playersSelected = [];
			$scope.state = "player-select";
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
				$scope.state = "confirm";
			else
				$scope.state = "player-select";
		};

		// add the game
		$scope.submit = function()
		{
			console.log($scope.command);
			FooseyService.addGame($scope.command);
			reset();
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
			$scope.command = "";
			$scope.game = [];
			getPlayers();
		}

		// get players from server
		function getPlayers()
		{
			FooseyService.players().then(function successCallback(response)
      { 
      	$scope.players = response.data.players;
    	}, function errorCallback(response)
      {
        $scope.error = true;
      });
		}

	});