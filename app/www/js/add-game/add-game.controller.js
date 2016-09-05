(function()
{
	angular
		.module('addGame')
		.controller('AddGameController', AddGameController);

	AddGameController.$inject = ['$scope', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', 'gameTypes', 'localStorage', 'FooseyService', 'SettingsService'];

	function AddGameController($scope, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, gameTypes, localStorage, FooseyService, SettingsService)
	{
		var selectedPlayer = undefined;
		var selectedScoreIndex = undefined;

		$scope.adding = _.isUndefined($stateParams.gameID);
		$scope.settings = SettingsService;
		$scope.gameTypes = gameTypes;
		$scope.useNowTime = true;
		$scope.customTime = undefined;
		$scope.customDate = undefined;
		$scope.scores = _.reverse(_.range(11)); // scores 0-10
		$scope.canCancel = false;
		$scope.filter = {};
		$scope.filter.text = '';

		$scope.addMorePlayers = addMorePlayers;
		$scope.choosePlayer = choosePlayer;
		$scope.chooseScore = chooseScore;
		$scope.gameSelect = gameSelect;
		$scope.isSelected = isSelected;
		$scope.playerSelected = playerSelected;
		$scope.playerSelect = playerSelect;
		$scope.scoreSelect = scoreSelect;
		$scope.playerName = playerName;
		$scope.reset = reset;
		$scope.submit = submit;
		$scope.undo = undo;

		// load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      setupDatePicker();
      reset();
    });

   	function setupDatePicker()
   	{
   		var MIN_MODAL_WIDTH = 600;
	    var options = {
	      preset  : 'datetime',
	      onSelect: setDate
	    };

	    // set up tapping
	    $('#date_button').scroller($.extend(options, { 
	    	theme: 'android-ics light', 
	    	mode: 'scroller', 
	    	display: $(window).width() > MIN_MODAL_WIDTH ? 'modal' : 'bottom' 
	    }));
   	}

		// function to select game type
		function gameSelect(index, type)
		{
			//return if it's the same type
			if ($scope.type.name === type.name) return;

			$scope.type = _.clone(type);
			var newTeams = _.clone($scope.teams);
			newTeams[0].players = type.playersPerTeam === 1 ? newTeams[0].players.slice(0, 1) : newTeams[0].players.slice(0, 1).concat([null]);
			newTeams[1].players = type.playersPerTeam === 1 ? newTeams[1].players.slice(0, 1) : newTeams[1].players.slice(0, 1).concat([null]);
			$scope.teams = newTeams;
			jump();
		}

		function choosePlayer(teamIndex, playerIndex)
		{
			selectedPlayer = { teamIndex: teamIndex, playerIndex: playerIndex };
			selectedScoreIndex = undefined;
			changeState("player-select", "Select Players");
			if (SettingsService.addGameSelect) $scope.$broadcast('selectFilterBar');
			if (SettingsService.addGameClear) $scope.filter.text = '';
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
			if (playerSelected(player)) return;
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
				if (jumpPlayers(t)) return;
				if (!SettingsService.addGameNames)
				{
					if (jumpScores(t)) return;
				}
			}
			if (SettingsService.addGameNames)
			{
				for (var t = 0; t < $scope.teams.length; t++)
				{
					if (jumpScores(t)) return;
				}
			}
			selectedPlayer = undefined;
			selectedScoreIndex = undefined;
			changeState("confirm", "Confirm");
		}

		function jumpPlayers(t)
		{
			for (var p = 0; p < $scope.teams[t].players.length; p++)
			{
				if ($scope.teams[t].players[p] === null)
				{ 
					choosePlayer(t, p);
					return true;
				}
			}
			return false;
		}

		function jumpScores(t)
		{
			if ($scope.teams[t].score === null)
			{
				chooseScore(t);
				return true;
			}
			return false;
		}

		function playerSelected(player)
		{
			var selected = false;
			_.each($scope.teams, function(team)
			{
				_.each(team.players, function(playerID)
				{
					if (playerID === player.playerID) selected = true;
				})
			})
			return selected;
		}

		// add the game
		function submit()
		{
			changeState("saving", null);
			$scope.saveStatus = "saving";
			$scope.canCancel = false;

			// set up game object
			var timestampVal = $('#date_button').val();
			var timestamp = timestampVal === '' ? undefined : new Date(timestampVal).getTime()/1000;
			var game = {
				id: $stateParams.gameID,
				teams: $scope.teams,
				timestamp: timestamp
			}

			var editOrAdd = $scope.adding ? FooseyService.addGame : FooseyService.editGame;

			editOrAdd(game).then(function successCallback(response)
			{
				$scope.response = response.data;
				$scope.saveStatus = "success";
				if ($scope.adding) $scope.gameToUndo = response.data.info.gameID;
				else $ionicHistory.goBack();
			}, function errorCallback(response)
	    {
	    	if ($scope.state === "saving")
	      	$scope.saveStatus = "failed";
	    });
		}

		// undo last game
		function undo()
		{
			$scope.saveStatus = "removing";
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
		function reset()
		{
			selectedPlayer = undefined;
			selectedScoreIndex = undefined;
			$('#date_button').val('');

			if ($scope.adding)
			{
				$scope.teams = emptyTeams(gameTypes[0]);
				$scope.gameToUndo = undefined;
				$scope.saveStatus = "";
				$scope.response = undefined;
				$scope.canCancel = false;

				$scope.useNowTime = true;
				$scope.customDate = new Date();
				$scope.customTime = $scope.customDate;

				choosePlayer(0, 0);
			}
			else
			{
				editGame();
				$scope.canCancel = true;
			}
			getPlayers();
		}

		function editGame()
		{
			FooseyService.getGame($stateParams.gameID).then(
				function(game)
				{
					_.each(game[0].teams, function(team)
					{
						team.players = _.map(team.players, 'playerID');
					})
					$scope.teams = game[0].teams;
					$scope.type = gameTypes[game[0].teams[0].players.length - 1];
					jump();
				})
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

		function emptyTeams(type)
		{
			$scope.type = _.clone(type);
			return [
				{
					players: type.playersPerTeam === 1 ? [null] : [null, null],
					score: null
				},
				{
					players: type.playersPerTeam === 1 ? [null] : [null, null],
					score: null
				}
			]
		}

		function changeState(state, title)
		{
			if (state) $scope.state = state;
			if (title) $scope.title = title;
			if (state !== 'player-select') $ionicScrollDelegate.scrollTop(true);
		}

		function setDate(event, inst)
    {
      console.log('set: ' + inst.val);
    }

		function addMorePlayers()
		{
			$state.go('app.manage-players');
		}
	}
})();