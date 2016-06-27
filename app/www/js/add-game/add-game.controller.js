(function()
{
	angular
		.module('addGame')
		.controller('AddGameController', AddGameController);

	AddGameController.$inject = ['$scope', '$state', '$ionicScrollDelegate', 'gameTypes', 'localStorage', 'FooseyService', 'SettingsService'];

	function AddGameController($scope, $state, $ionicScrollDelegate, gameTypes, localStorage, FooseyService, SettingsService)
	{
		var selectedPlayer = undefined;
		var selectedScoreIndex = undefined;

		$scope.settings = SettingsService;
		$scope.gameTypes = gameTypes;
		$scope.reset = reset;
		$scope.useNowTime = true;
		$scope.customTime = undefined;
		$scope.customDate = undefined;
		$scope.scores = _.range(11);
		$scope.canCancel = false;

		$scope.addMorePlayers = addMorePlayers;
		$scope.choosePlayer = choosePlayer;
		$scope.chooseScore = chooseScore;
		$scope.filterPlayers = filterPlayers;
		$scope.isSelected = isSelected;
		$scope.playerSelect = playerSelect;
		$scope.scoreSelect = scoreSelect;
		$scope.playerName = playerName;
		$scope.submit = submit;
		$scope.undo = undo;

		// load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      reset();
    });

		// function to select game
		function gameSelect(type)
		{
			$scope.type = _.clone(type);
			$scope.teams = [
				{
					players: type.playersPerTeam === 1 ? [null] : [null, null],
					score: null
				},
				{
					players: type.playersPerTeam === 1 ? [null] : [null, null],
					score: null
				}
			]
		};

		function choosePlayer(teamIndex, playerIndex)
		{
			selectedPlayer = { teamIndex: teamIndex, playerIndex: playerIndex };
			selectedScoreIndex = undefined;
			changeState("player-select", "Select Players");
		}

		function chooseScore(teamIndex)
		{
			selectedScoreIndex = teamIndex;
			selectedPlayer = undefined;
			changeState("score-select", "Select Score");
		}

		function isSelected(teamIndex, playerIndex)
		{
			return (selectedPlayer &&
							selectedPlayer.teamIndex === teamIndex && 
							selectedPlayer.playerIndex === playerIndex) ||
						 (selectedScoreIndex === teamIndex &&
						 	playerIndex === -1);
		}

		// function to select player
		function playerSelect(player)
		{
			$scope.canCancel = true;

			team = $scope.teams[selectedPlayer.teamIndex];
			team.players[selectedPlayer.playerIndex] = player.playerID;
			
			jump();
		};

		// function to select score
		function scoreSelect(score)
		{	
			team = $scope.teams[selectedScoreIndex];
			team.score = score;

			jump();
		};

		function jump()
		{
			for (var t = 0; t < $scope.teams.length; t++)
			{
				for (var p = 0; p < $scope.teams[t].players.length; p++)
				{
					if ($scope.teams[t].players[p] === null)
					{ 
						choosePlayer(t, p);
						return;
					}
				}
				if ($scope.teams[t].score === null)
				{
					chooseScore(t);
					return;
				}
			}
			selectedPlayer = undefined;
			selectedScoreIndex = undefined;
			changeState("confirm", "Confirm");
		}

		function filterPlayers(player)
		{
			var allowed = true;
			_.each($scope.teams, function(team)
			{
				_.each(team.players, function(playerID)
				{
					if (playerID === player.playerID) allowed = false;
				})
			})
			return allowed;
		}

		// add the game
		function submit()
		{
			changeState("saving", null);
			$scope.saveStatus = "saving";
			$scope.canCancel = false;

			// set up game object
			var game = {
				teams: $scope.teams
			}

			FooseyService.addGame(game).then(function successCallback(response)
			{
				$scope.response = response.data;
				$scope.saveStatus = "success";
				$scope.gameToUndo = response.data.info.gameID;
			}, function errorCallback(response)
	    {
	    	if ($scope.state === "saving")
	      	$scope.saveStatus = "failed";
	    });
		}

		// undo last game
		function undo()
		{
			FooseyService.removeGame($scope.gameToUndo).then(function successCallback(response)
			{
				$scope.saveStatus = "removed";
				$scope.gameToUndo = undefined;
				$scope.response = [];
			}, function errorCallback(response)
	    {
	    	if ($scope.state === "saving")
	      	$scope.saveStatus = "failed";
	    });
		}

		// reset the game
		function reset(gameType)
		{
			selectedPlayer = undefined;
			selectedScoreIndex = undefined;

			$scope.teams = [];
			$scope.gameToUndo = undefined;
			$scope.saveStatus = "";
			$scope.response = undefined;
			$scope.canCancel = false;

			$scope.useNowTime = true;
			$scope.customDate = new Date();
			$scope.customTime = $scope.customDate;

			gameSelect(gameType || gameTypes[0]);
			choosePlayer(0, 0);
			getPlayers();
		}

		// get players from server
		function getPlayers()
		{
			// load from local storage
			$scope.players = localStorage.getObject('players');

			// load from server
			FooseyService.getAllPlayers(true).then(
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
			var name = undefined;
			_.each($scope.players, function(player)
			{
				if (player.playerID === id) name = player.displayName;
			});
			return name;
		}

		function changeState(state, title)
		{
			if (state) $scope.state = state;
			if (title) $scope.title = title;
			$ionicScrollDelegate.scrollTop(true);
		}

		function addMorePlayers()
		{
			$state.go('app.manage-players');
		}
	}
})();