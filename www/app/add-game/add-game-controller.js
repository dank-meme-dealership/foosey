angular.module('foosey')
	.controller('AddGameController', function($scope)
	{
		// initialize page
		reset();
		$scope.scores = new Array(11); // 0-10

		// Load players from local storage
		$scope.players = [
			"matt", "brik", "roger", "conner", "adam", "erich", "jody", "greg", "blake"
		];

		// Grab list of players from server


		// Set up the types of games you cal play
		$scope.gameTypes = [
			{
				name: "1 vs. 1",
				teams: 2,
				players: 2
			},
			{
				name: "2 vs. 2",
				teams: 2,
				players: 4
			},
			{
				name: "Trips",
				teams: 3,
				players: 3
			},
			{
				name: "Other"
			}
		];

		// function to select game
		$scope.gameSelect = function(type)
		{
			$scope.type = _.clone(type);
			$scope.playersSelected = [];
			$scope.playersPerTeam = $scope.type.players / $scope.type.teams;
			$scope.state = "player-select";
		};

		// function to select player
		$scope.playerSelect = function(player)
		{
			$scope.playersSelected.push(player);

			// if we have selected all players for the team, select the score
			if ($scope.playersSelected.length === $scope.playersPerTeam)
			{
				$scope.state = "score-select";
			}
		};

		// function to select score
		$scope.scoreSelect = function(score)
		{
			appendToCommand($scope.playersSelected, score);
			$scope.playersSelected = [];
			$scope.type.teams--;
			if ($scope.type.teams === 0)
			{
				submit();
			}
			else
			{
				$scope.state = "player-select";
			}
		};

		function appendToCommand(players, score)
		{
			for (var i = 0; i < $scope.playersPerTeam; i++)
			{
				$scope.command += players[i] + " " + score + " ";
			}
		}

		function submit()
		{
			$scope.state = "game-select";
			console.log($scope.command);
			$scope.command = "";
		}

		function reset()
		{
			$scope.state = "game-select";
			$scope.command = "";
		}

	});