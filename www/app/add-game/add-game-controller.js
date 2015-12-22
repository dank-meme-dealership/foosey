angular.module('foosey')
	.controller('AddGameController', function($scope, FooseyService)
	{
		// initialize page
		reset();
		$scope.scores = new Array(11); // 0-10

		// Load players from local storage
		

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
			// don't allow selected players to be selected again
			if (player.selected) return;

			// add player to this team
			player.selected = true;
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
			
			// if we have scores for every team, submit
			if ($scope.type.teams === 0)
				submit();
			else
				$scope.state = "player-select";
		};

		// function to build the add command out for foosey
		function appendToCommand(players, score)
		{
			for (var i = 0; i < $scope.playersPerTeam; i++)
			{
				$scope.command += players[i].name + " " + score + " ";
			}
		}

		// add the game
		function submit()
		{
			console.log($scope.command);
			FooseyService.addGame($scope.command);
			reset();
		}

		// reset the game
		function reset()
		{
			$scope.state = "game-select";
			$scope.command = "";
			$scope.players = [
				{
					name: "matt",
					selected: false
				},
				{
					name: "brik",
					selected: false
				},
				{
					name: "roger",
					selected: false
				},
				{
					name: "conner",
					selected: false
				},
				{
					name: "adam",
					selected: false
				},
				{
					name: "erich",
					selected: false
				},
				{
					name: "jody",
					selected: false
				},
				{
					name: "greg",
					selected: false
				},
				{
					name: "blake",
					selected: false
				},
			];
		}

	});