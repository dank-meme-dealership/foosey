(function () {
  angular
    .module('foosey.addGame')
    .controller('AddGameController', AddGameController);

  function AddGameController($scope, $state, $stateParams, $ionicHistory, $ionicModal, $ionicPopup, $ionicScrollDelegate, gameTypes, $filter, FooseyService, PlayerService, SettingsService) {
    $scope.selectedPlayer = undefined;
    $scope.selectedScoreIndex = undefined;
    $scope.adding = _.isUndefined($stateParams.gameID);
    $scope.settings = SettingsService;
    $scope.players = PlayerService;
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
    $scope.loadRecentPlayers = true;
    $scope.gameID = $stateParams.gameID;

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
    $scope.resetToAdding = resetToAdding;
    $scope.submit = submit;
    $scope.undo = undo;
    $scope.edit = edit;
    $scope.show = show;
    $scope.jump = jump;
    $scope.openModal = openModal;

    // load on entering view
    $scope.$on('$ionicView.beforeEnter', function () {
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
    function reset() {
      $ionicScrollDelegate.scrollTop(true);
      $scope.selectedPlayer = undefined;
      $scope.selectedScoreIndex = undefined;
      $scope.useCustom = !$scope.adding;
      $scope.loadRecentPlayers = SettingsService.addGameRecents; // set if we should load recent players based on setting

      if ($scope.adding) {
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
      } else {
        editGame();
        $scope.canCancel = true;
      }
      PlayerService.updatePlayers();
      if ($scope.loadRecentPlayers) getRecentPlayers();
    }

    // this function is solely here for the purpose
    // of returning back from editting the game from
    // the add game tab, since we don't want to go to
    // any other states but here.
    function resetToAdding() {
      $scope.adding = true;
      reset();
    }

    function editGame() {
      FooseyService.getGame($scope.gameID).then(function (game) {
        _.each(game[0].teams, function (team) {
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
    function setupPicker(type, onSelect) {
      var MIN_MODAL_WIDTH = 600;
      $('#' + type).scroller($.extend({
        preset: type,
        onSelect: onSelect
      }, {
        theme: 'android-ics light',
        mode: 'scroller',
        display: $(window).width() > MIN_MODAL_WIDTH ? 'modal' : 'bottom'
      })).scroller('setDate', getCustomTime(), true);
    }

    function setDate(event, inst) {
      $scope.customDate = inst.val;
      $scope.$apply();
    }

    function setTime(event, inst) {
      $scope.customTime = inst.val;
      $scope.$apply();
    }

    function enableCustom() {
      $scope.useCustom = true;
    }

    function getCustomTime() {
      return new Date($scope.customDate + ' ' + $scope.customTime);
    }

    // show date/time picker
    function show(type) {
      $('#' + type).mobiscroll('show');
    }

    // function to select game type
    function gameSelect(index, type) {
      //return if it's the same type
      if ($scope.type.name === type.name) return;

      $scope.type = _.clone(type);
      var newTeams = _.clone($scope.teams);

      // if choose names first, rotate names on teams
      if (SettingsService.addGameNames) {
        var player2 = newTeams[0].players.slice(1, 2);
        newTeams[0].players = type.playersPerTeam === 1 ? newTeams[0].players.slice(0, 1) : newTeams[0].players.slice(0, 1).concat(newTeams[1].players.slice(0, 1));
        newTeams[1].players = type.playersPerTeam === 1 ? player2 : [null, null];
      }
      // otherwise extend teams to allow additional players or cut last players
      else {
        newTeams[0].players = type.playersPerTeam === 1 ? newTeams[0].players.slice(0, 1) : newTeams[0].players.slice(0, 1).concat([null]);
        newTeams[1].players = type.playersPerTeam === 1 ? newTeams[1].players.slice(0, 1) : newTeams[1].players.slice(0, 1).concat([null]);
      }
      $scope.teams = newTeams;
      jump();
    }

    function choosePlayer(teamIndex, playerIndex) {
      $scope.selectedPlayer = {teamIndex: teamIndex, playerIndex: playerIndex};
      $scope.selectedScoreIndex = undefined;
      changeState('player-select');
      if (SettingsService.addGameSelect) $scope.$broadcast('selectFilterBar');
      if (SettingsService.addGameClear) $scope.filter.text = '';
    }

    function chooseScore(teamIndex) {
      $scope.selectedScoreIndex = teamIndex;
      $scope.selectedPlayer = undefined;
      scoreSelect(null);
      changeState('score-select');
    }

    function isSelected(teamIndex, playerIndex) {
      return ($scope.selectedPlayer &&
        $scope.selectedPlayer.teamIndex === teamIndex &&
        $scope.selectedPlayer.playerIndex === playerIndex) ||
        ($scope.selectedScoreIndex === teamIndex &&
        playerIndex === -1);
    }

    // function to select player
    function playerSelect(player) {
      if (playerSelected(player) || $scope.loadRecentPlayers) return;
      $scope.canCancel = true;

      team = $scope.teams[$scope.selectedPlayer.teamIndex];
      team.players[$scope.selectedPlayer.playerIndex] = player.playerID;

      jump();
    }

    // function to select score
    function scoreSelect(score) {
      team = $scope.teams[$scope.selectedScoreIndex];
      team.score = team.score === null || score === null ? score : team.score + '' + score;

      // if they want the normal picker, jump after setting score
      if (parseInt(team.score) >= 0 && !SettingsService.addGamePicker) jump();
    }

    function jump() {
      for (var t = 0; t < $scope.teams.length; t++) {
        if (jumpPlayers(t)) return;
        if (!SettingsService.addGameNames) {
          if (jumpScores(t)) return;
        }
      }
      if (SettingsService.addGameNames) {
        for (var t = 0; t < $scope.teams.length; t++) {
          if (jumpScores(t)) return;
        }
      }
      $scope.selectedPlayer = undefined;
      $scope.selectedScoreIndex = undefined;
      changeState('confirm');
    }

    function jumpPlayers(t) {
      for (var p = 0; p < $scope.teams[t].players.length; p++) {
        if ($scope.teams[t].players[p] === null) {
          choosePlayer(t, p);
          return true;
        }
      }
      return false;
    }

    function jumpScores(t) {
      if ($scope.teams[t].score === null) {
        chooseScore(t);
        return true;
      }
      return false;
    }

    function playerSelected(player) {
      var selected = false;
      _.each($scope.teams, function (team) {
        _.each(team.players, function (playerID) {
          if (playerID === player.playerID) selected = true;
        })
      });
      return selected;
    }

    // determine if the game about to be logged is the same
    // as the last game that was just logged, then proceed
    // to saving the game
    function submit() {
      // move to saving state
      changeState('saving');
      $scope.saveStatus = 'saving';

      // when editing a game, we don't care about the equivalence
      if ($scope.adding) {
        // get the last game logged
        FooseyService.getGames(1, 0).then(function (response) {
          // if no games logged, just save
          if (response.length === 0) {
            save();
            return;
          }

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
            _.isEqual(_.map(losers.players, 'playerID').sort(), losersToBe.players.sort())) { // losers are equal
            // confirm that they want to save duplicate
            confirmSave(game);
          } else {
            save();
          }
        });
      } else {
        save();
      }
    }

    // confirm that they do want to save the duplicate
    function confirmSave(game) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Possible Duplicate Game',
        template: 'This game is the same as another game that was logged ' + $filter('time')(game.timestamp, true, true) + '. Do you wish to proceed?'
      });

      // if yes, save the last game
      confirmPopup.then(function (positive) {
        if (positive) {
          save();
        } else {
          changeState('confirm');
        }
      });
    }

    // add the game
    function save() {
      // disallow cancelling at this point
      $scope.canCancel = false;

      // set up game object
      var timestamp = getCustomTime().getTime() / 1000
      var game = {
        id: $scope.gameID,
        teams: $scope.teams,
        timestamp: $scope.useCustom ? timestamp : undefined
      };

      var editOrAdd = $scope.adding ? FooseyService.addGame : FooseyService.editGame;

      editOrAdd(game).then(function successCallback(response) {
        $scope.response = response.data;
        $scope.saveStatus = 'success';
        // simply added a game
        if ($scope.adding) {
          $scope.gameToUndo = response.data.info.gameID;
        }
        // edited a recently added game from add game tab
        else if ($scope.gameToUndo) {
          $scope.adding = true;
        }
        // just edited a game elsewhere
        else {
          $ionicHistory.goBack();
        }
      }, function errorCallback(response) {
        if ($scope.state === 'saving') $scope.saveStatus = 'failed';
      });
    }

    // undo last game
    function undo() {
      $scope.saveStatus = 'removing';
      FooseyService.removeGame($scope.gameToUndo).then(function successCallback(response) {
        $scope.saveStatus = 'removed';
        $scope.gameToUndo = undefined;
        $scope.response = [];
      }, function errorCallback(response) {
        if ($scope.state === 'saving') $scope.saveStatus = 'failed';
      });
    }

    function edit() {
      $scope.gameID = $scope.gameToUndo;
      $scope.adding = false;
      reset();
    }

    // set up some recent players
    function getRecentPlayers() {
      PlayerService.updateRecentPlayers(SettingsService.playerID).then(function () {
        $scope.loadRecentPlayers = false;
      });
    }

    function playerName(id) {
      var name = undefined;
      _.each(PlayerService.all, function (player) {
        if (player.playerID === id) name = player.displayName;
      });
      return name;
    }

    function emptyTeams(type) {
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
      ];
    }

    // change to a new state on the add game page
    function changeState(state) {
      if (state) $scope.state = state;
      if (state !== 'player-select') $ionicScrollDelegate.scrollTop(true);
    }

    function addMorePlayers() {
      $state.go('app.manage-players');
    }

    // adds a player (function accessible to all players via add-game screen)
    function addPlayer(player) {
      FooseyService.addPlayer({
        displayName: !player.displayName ? '' : player.displayName,
        admin: false,
        active: true
      }).then(PlayerService.updatePlayers);
      $scope.modal.hide();
    }

    function openModal() {
      $scope.player = {};
      $scope.modal.show();
    }
  }
})();