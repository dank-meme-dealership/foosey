(function()
{
	angular
		.module('addGame')
		.controller('AddGameController', AddGameController);

	AddGameController.$inject = ['$scope', '$rootScope', '$ionicScrollDelegate', 'gameTypes', 'localStorage', 'FooseyService', 'SettingsService'];

	function AddGameController($scope, $rootScope, $ionicScrollDelegate, gameTypes, localStorage, FooseyService, SettingsService)
	{
		// send to login screen if they haven't logged in yet
		if (!SettingsService.loggedIn) SettingsService.logOut();

		$scope.settings = SettingsService;
		$scope.gameTypes = gameTypes;
		$scope.reset = reset;
		$scope.playerName = playerName;
		$scope.useNowTime = true;
		$scope.customTime = undefined;
		$scope.customDate = undefined;

		// initialize page
		reset();
		$scope.scores = new Array(11);

		$scope.gameSelect = gameSelect;
		$scope.playerSelect = playerSelect;
		$scope.scoreSelect = scoreSelect;
		$scope.submit = submit;
		$scope.undo = undo;

		// function to select game
		function gameSelect(type)
		{
			$scope.type = _.clone(type);
			$scope.playersSelected = [];
			changeState("player-select", "Select Players");
		};

		// function to select player
		function playerSelect(player)
		{
			// don't allow selected players to be selected again
			if (player.selected) return;

			// add player to this team
			player.selected = true;
			$scope.playersSelected.push(player.playerID);

			// if we have selected all players for the team, select the score
			if ($scope.playersSelected.length === $scope.type.playersPerTeam)
			{
				changeState("score-select", "Select Score");
			}
		};

		// function to select score
		function scoreSelect(score)
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
				changeState("confirm", "Confirm");
			}
			else
			{
				changeState("player-select", "Select Players");
			}
		};

		// add the game
		function submit()
		{
			changeState("saving", null);
			$scope.saveStatus = "saving";

			// set up game object
			var game = {
				teams: $scope.game
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
			changeState("game-select", "Select the Type of Game");
			$scope.command = "";

			$scope.game = [];
			$scope.gameToUndo = undefined;
			$scope.saveStatus = "";
			$scope.response = undefined;

			$scope.useNowTime = true;
			$scope.customDate = new Date();
			$scope.customTime = $scope.customDate;

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
			var name = '';
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
			$ionicScrollDelegate.scrollTop();

		}

		$rootScope.$on("$stateChangeSuccess", function() {
		  reset();
		});

	}
})();