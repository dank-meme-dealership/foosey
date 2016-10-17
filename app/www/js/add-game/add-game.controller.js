(function()
{
	angular
		.module('addGame')
		.controller('AddGameController', AddGameController);

	AddGameController.$inject = ['$scope', '$state', '$stateParams', '$ionicHistory', '$ionicModal', '$ionicPopup', '$ionicScrollDelegate', 'gameTypes', '$filter', 'localStorage', 'FooseyService', 'SettingsService'];

	function AddGameController($scope, $state, $stateParams, $ionicHistory, $ionicModal, $ionicPopup, $ionicScrollDelegate, gameTypes, $filter, localStorage, FooseyService, SettingsService)
	{
		$scope.selectedPlayer = undefined;
		$scope.selectedScoreIndex = undefined;
		$scope.adding = _.isUndefined($stateParams.gameID);
		$scope.settings = SettingsService;
		$scope.gameTypes = gameTypes;
		$scope.useCustom = false;
		$scope.customTime = undefined;
		$scope.customDate = undefined;
		$scope.scores = [7, 8, 9, 4, 5, 6, 1, 2, 3];
		$scope.scoresTen = _.reverse(_.range(11));
		$scope.canCancel = false;
		$scope.filter = {};
		$scope.filter.text = '';
		$scope.type = undefined;
		$scope.players = undefined;
		$scope.recentPlayers = undefined;
		$scope.loadRecentPlayers = true;

		$scope.addMorePlayers = addMorePlayers;
		$scope.addPlayer = addPlayer;
		$scope.choosePlayer = choosePlayer;
		$scope.chooseScore = chooseScore;
		$scope.enableCustom = enableCustom;
		$scope.gameSelect = gameSelect;
		$scope.isSelected = isSelected;
		$scope.playerSelected = playerSelected;
		$scope.playerSelect = playerSelect;
		$scope.scoreSelect = scoreSelect;
		$scope.playerName = playerName;
		$scope.reset = reset;
		$scope.submit = submit;
		$scope.undo = undo;
		$scope.show = show;
		$scope.jump = jump;
		$scope.openModal = openModal;

		// load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
      
      // this is here so clearing doesn't reset tab at top
      $scope.type = undefined;
      reset();
    });

	//load add player modal
	$ionicModal.fromTemplateUrl('js/player/player-add.html', {
		scope: $scope
	}).then(function (modal) {
		$scope.modal = modal;
	});

    // reset the game
		function reset()
		{
			$scope.selectedPlayer = undefined;
			$scope.selectedScoreIndex = undefined;
			$scope.useCustom = !$scope.adding;
			$scope.loadRecentPlayers = SettingsService.addGameRecents;

			if ($scope.adding)
			{
				$scope.teams = emptyTeams($scope.type || gameTypes[0]);
				$scope.gameToUndo = undefined;
				$scope.saveStatus = '';
				$scope.response = undefined;
				$scope.canCancel = false;
				$scope.customTime = moment().format('hh:mm A');
				$scope.customDate = moment().format('MM/DD/YYYY');
				setupPicker('date', setDate);
      	setupPicker('time', setTime);

				choosePlayer(0, 0);
			}
			else
			{
				editGame();
				$scope.canCancel = true;
			}
			getPlayers();
			if ($scope.loadRecentPlayers) getRecentPlayers();
		}

		function editGame()
		{
			FooseyService.getGame($stateParams.gameID).then(
				function(game)
				{
					_.each(game[0].teams, function(team)
					{
						team.players = _.map(team.players, 'playerID');
					});
					$scope.customTime = moment.unix(game[0].timestamp).format('hh:mm A');
					$scope.customDate = moment.unix(game[0].timestamp).format('MM/DD/YYYY');
					$scope.teams = game[0].teams;
					$scope.type = gameTypes[game[0].teams[0].players.length - 1];
					setupPicker('date', setDate);
      		setupPicker('time', setTime);
					jump();
				})
		}

	  // set up pickers
   	function setupPicker(type, onSelect)
   	{
   		var MIN_MODAL_WIDTH = 600;
	    $('#'+type).scroller($.extend({
	      preset  : type,
	      onSelect: onSelect
	    },{
	    	theme: 'android-ics light',
	    	mode: 'scroller', 
	    	display: $(window).width() > MIN_MODAL_WIDTH ? 'modal' : 'bottom' 
	    })).scroller('setDate', getCustomTime(), true);
   	}

   	function setDate(event, inst)
    {
      $scope.customDate = inst.val;
      $scope.$apply();
    }

    function setTime(event, inst)
    {
      $scope.customTime = inst.val;
      $scope.$apply();
    }

    function enableCustom()
		{
			$scope.useCustom = true;
		}

    function getCustomTime()
    {
    	return new Date($scope.customDate + ' ' + $scope.customTime);
    }

    // show date/time picker
   	function show(type)
		{
			$('#'+type).mobiscroll('show');
		}

		// function to select game type
		function gameSelect(index, type)
		{
			//return if it's the same type
			if ($scope.type.name === type.name) return;

			$scope.type = _.clone(type);
			var newTeams = _.clone($scope.teams);

			// if choose names first, rotate names on teams
			if (SettingsService.addGameNames)
			{
				var player2 = newTeams[0].players.slice(1, 2);
				newTeams[0].players = type.playersPerTeam === 1 ? newTeams[0].players.slice(0, 1) : newTeams[0].players.slice(0, 1).concat(newTeams[1].players.slice(0, 1));
				newTeams[1].players = type.playersPerTeam === 1 ? player2 : [null, null];
			}
			// otherwise extend teams to allow additional players or cut last players
			else
			{
				newTeams[0].players = type.playersPerTeam === 1 ? newTeams[0].players.slice(0, 1) : newTeams[0].players.slice(0, 1).concat([null]);
				newTeams[1].players = type.playersPerTeam === 1 ? newTeams[1].players.slice(0, 1) : newTeams[1].players.slice(0, 1).concat([null]);
			}
			$scope.teams = newTeams;
			jump();
		}

		function choosePlayer(teamIndex, playerIndex)
		{
			$scope.selectedPlayer = { teamIndex: teamIndex, playerIndex: playerIndex };
			$scope.selectedScoreIndex = undefined;
			changeState('player-select', 'Select Players');
			if (SettingsService.addGameSelect) $scope.$broadcast('selectFilterBar');
			if (SettingsService.addGameClear) $scope.filter.text = '';
		}

		function chooseScore(teamIndex)
		{
			$scope.selectedScoreIndex = teamIndex;
			$scope.selectedPlayer = undefined;
			scoreSelect(null);
			changeState('score-select', 'Select Score');
		}

		function isSelected(teamIndex, playerIndex)
		{
			return ($scope.selectedPlayer &&
							$scope.selectedPlayer.teamIndex === teamIndex && 
							$scope.selectedPlayer.playerIndex === playerIndex) ||
						 ($scope.selectedScoreIndex === teamIndex &&
						 	playerIndex === -1);
		}

		// function to select player
		function playerSelect(player)
		{
			if (playerSelected(player) || $scope.loadRecentPlayers) return;
			$scope.canCancel = true;

			team = $scope.teams[$scope.selectedPlayer.teamIndex];
			team.players[$scope.selectedPlayer.playerIndex] = player.playerID;
			
			jump();
		};

		// function to select score
		function scoreSelect(score)
		{	
			team = $scope.teams[$scope.selectedScoreIndex];
			team.score = team.score === null || score === null ? score : team.score + '' + score;

			// if they want the normal picker, jump after setting score
			if (parseInt(team.score) >= 0 && !SettingsService.addGamePicker) jump();
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
			$scope.selectedPlayer = undefined;
			$scope.selectedScoreIndex = undefined;
			changeState('confirm', 'Confirm');
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

		// determine if the game about to be logged is the same
		// as the last game that was just logged, then proceed
		// to saving the game
		function submit()
		{
			// when editing a game, we don't care about the equivalence
			if ($scope.adding)
			{
				// get the last game logged
				FooseyService.getGames(1, 0).then(
					function(response)
					{
						// winners and losers from server
						var game = response[0];
						var winners = game.teams[0];
						var losers = game.teams[1];

						// winners and losers to be logged
						var winnerFirst = $scope.teams[0].score > $scope.teams[1].score;
						var winnersToBe = $scope.teams[winnerFirst ? 0 : 1];
						var losersToBe = $scope.teams[winnerFirst ? 1 : 0];

						// evaluate the game
						if (winners.score === winnersToBe.score && losers.score === losersToBe.score && // scores are equal
								_.isEqual(_.map(winners.players, 'playerID').sort(), winnersToBe.players.sort()) && // winners are equal
								_.isEqual(_.map(losers.players, 'playerID').sort(), losersToBe.players.sort())) // losers are equal
						{
							// confirm that they want to save duplicate
							confirmSave(game);
						}
						else
						{
							save();
						}
					});
			}
			else
			{
				save();
			}
		}

		// confirm that they do want to save the duplicate
		function confirmSave(game)
		{
			var confirmPopup = $ionicPopup.confirm({
        title: 'Possible Duplicate Game',
        template: 'This game is the same as another game that was logged ' + $filter('time')(game.timestamp, true, true) + '. Do you wish to proceed?'
      });

      // if yes, save the last game
      confirmPopup.then(function(positive) {
        if(positive) {
          save();
        }
      });
		}

		// add the game
		function save()
		{
			changeState('saving', null);
			$scope.saveStatus = 'saving';
			$scope.canCancel = false;

			// set up game object
			var timestamp = getCustomTime().getTime()/1000
			var game = {
				id: $stateParams.gameID,
				teams: $scope.teams,
				timestamp: $scope.useCustom ? timestamp : undefined
			}

			var editOrAdd = $scope.adding ? FooseyService.addGame : FooseyService.editGame;

			editOrAdd(game).then(function successCallback(response)
			{
				$scope.response = response.data;
				$scope.saveStatus = 'success';
				if ($scope.adding) $scope.gameToUndo = response.data.info.gameID;
				else $ionicHistory.goBack();
			}, function errorCallback(response)
	    {
	    	if ($scope.state === 'saving')
	      	$scope.saveStatus = 'failed';
	    });
		}

		// undo last game
		function undo()
		{
			$scope.saveStatus = 'removing';
			FooseyService.removeGame($scope.gameToUndo).then(function successCallback(response)
			{
				$scope.saveStatus = 'removed';
				$scope.gameToUndo = undefined;
				$scope.response = [];
			}, function errorCallback(response)
	    {
	    	if ($scope.state === 'saving')
	      	$scope.saveStatus = 'failed';
	    });
		}

		// get players from server
		function getPlayers()
		{
			// load from local storage
			var players = localStorage.getObject('players');
			$scope.players = _.isArray(players) ? players : [];

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

		// set up some recent players
		function getRecentPlayers()
		{
			// load from local storage
			var recentPlayers = localStorage.getObject('recentPlayers');
			$scope.recentPlayers = _.isArray(recentPlayers) ? recentPlayers : [];

			// load from server
			FooseyService.getPlayerGames(SettingsService.playerID, 10).then(
				function(response)
				{
					var recents = [];
					_.each(response.data, function(game)
					{
						_.each(game.teams, function(team)
						{
							_.each(team.players, function(player)
							{
								recents = _.unionBy(recents, [player], 'playerID');
							}); 
						});
					});
					var you = _.remove(recents, function(p) 
						{ 
							return p.playerID === SettingsService.playerID 
						});
					$scope.recentPlayers = _.union(you, recents);
					$scope.loadRecentPlayers = false;

					localStorage.setObject('recentPlayers', $scope.recentPlayers);
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

		// change to a new state on the add game page
		function changeState(state, title)
		{
			if (state) $scope.state = state;
			if (title) $scope.title = title;
			if (state !== 'player-select') $ionicScrollDelegate.scrollTop(true);
		}

		function addMorePlayers()
		{
			$state.go('app.manage-players');
		}
		
		// adds a player (function accesible to all players via add-game screen)
		function addPlayer(player)
		{
			FooseyService.addPlayer(
			{
				displayName: !player.displayName ? '' : player.displayName,
				admin: false,
				active: true
			}).then(getPlayers);
			$scope.modal.hide();
		}

		function openModal() {
			$scope.player = {};
			$scope.modal.show();
		};
	}
})();