(function () {
  angular
    .module('foosey.experiments.eloReview', [])
    .component('eloReview', {
      templateUrl: 'components/elo-review/elo-review.tpl.html',
      controller: controller
    });

  function controller($timeout, api) {
    var $ctrl = this;

    $ctrl.cancelled = false;
    $ctrl.loading = false;
    $ctrl.gameIndex = 0;

    // default form actions
    $ctrl.options = {
      hideActive: false,
      delay: 70,
      minQualified: 100,
      sortBy: 'elo',
      leagueID: 1
    };

    $ctrl.runExperiment = runExperiment;
    $ctrl.changeSort = changeSort;

    function runExperiment() {
      $ctrl.loading = true;

      reset();

      cancelScheduled();

      cleanUpForm();

      // fetch all players for a league
      notify('Fetching players...');
      api.getAllPlayers($ctrl.options.leagueID, $ctrl.options.hideActive).then(function (players) {
        $ctrl.playerNameLookUp = getPlayerLookup(players);

        // if there are players, get the games
        if (_.valuesIn($ctrl.playerNameLookUp).length) {
          notify('Fetching games...');
          api.getAllEloHistory($ctrl.options.leagueID).then(function (eloStats) {
            $ctrl.allGames = fixGameData(eloStats.data);

            // if we have games, great! Let's do this thing :)
            if ($ctrl.allGames.length) {
              $ctrl.notice = {};
              $ctrl.loading = false;
              setNextGame();
            } else {
              notify('No games for this league, does it exist?', true);
            }
          });
        } else {
          notify('No players in this league, does it exist?', true);
        }
      });
    }

    /**
     * Allow sorting by another field
     * @param field
     */
    function changeSort(field) {
      $ctrl.options.sortBy = field;
      doSort();
    }

    /**
     * Actually sort the list
     */
    function doSort() {
      // sort the players by elo rating bby default, but potentially game or name
      $ctrl.players = _.sortBy($ctrl.players, $ctrl.options.sortBy);

      // sorting by name should not be reversed, because A-Z makes more sense
      if ($ctrl.options.sortBy !== 'name') {
        $ctrl.players = _.reverse($ctrl.players);
      }
    }

    /**
     * Make an object to look up names by playerID
     * @param players
     * @returns {{}}
     */
    function getPlayerLookup(players) {
      var names = {};

      _.each(players, function (player) {
        names[player.playerID] = player.displayName;
      });

      return names;
    }

    /**
     * Structure, sort, and filter the games so we can iterate through clean
     * data containing only the timestamp and the players with their elos
     * @param players
     * @returns {Array}
     */
    function fixGameData(players) {
      var games = [];
      _.each(players, function (player) {

        // let's limit the number of games they had to play, also remove inactive players if we need to
        if (player.elos.length >= $ctrl.options.minQualified && $ctrl.playerNameLookUp[player.playerID]) {
          _.each(player.elos, function (game) {
            // if this game hasn't been recorded yet, add it
            if (!games[game.gameID]) {
              games[game.gameID] = {
                players: [],
                timestamp: game.timestamp
              };
            }

            // add just the properties we care about for this player
            games[game.gameID].players.push({
              playerID: player.playerID,
              elo: game.elo
            });
          });
        }
      });

      // filter out indices in the array that would be blank
      // (most likely deleted games), and then sort by timestamp
      return _.sortBy(_.filter(games, 'players.length'), 'timestamp');
    }

    /**
     * Apply the next game's elo ratings to the table and schedule the next
     * run based on the value in the delay box
     */
    function setNextGame() {
      var players = $ctrl.allGames[$ctrl.gameIndex++].players;

      // update the elos of the players
      _.each(players, function (player) {
        var index = _.findIndex($ctrl.players, {playerID: player.playerID});

        // doesn't exist yet, so just add this player now with the current elo
        if (index < 0) {
          $ctrl.players.push(_.extend(player, {name: $ctrl.playerNameLookUp[player.playerID], games: 1}));
        }

        // does exist, update the elo
        else {
          $ctrl.players[index].elo = player.elo;
          $ctrl.players[index].games++;
        }
      });

      doSort();

      setBars();

      // then wait DELAY and do the next game
      if ($ctrl.gameIndex < $ctrl.allGames.length) {
        $ctrl.nextScheduled = $timeout(setNextGame, $ctrl.options.delay);
      }
    }

    /**
     * Set the values for the skill bars
     */
    function setBars() {
      var high = _.maxBy($ctrl.players, 'elo').elo;
      var low = _.minBy($ctrl.players, 'elo').elo;
      $ctrl.maxSkill = high - low;

      _.each($ctrl.players, function (player) {
        player.skill = player.elo - low;
      })
    }

    /**
     * Resert some things :)
     */
    function reset() {
      $ctrl.notice = {};
      $ctrl.players = [];
      $ctrl.gameIndex = 0;
    }

    /**
     * Cancel any scheduled setting of the next game
     */
    function cancelScheduled() {
      if ($ctrl.nextScheduled) {
        $timeout.cancel($ctrl.nextScheduled);
        $ctrl.nextScheduled = undefined;
      }
    }

    /**
     * Clean up the form and default
     */
    function cleanUpForm() {
      $ctrl.options = _.extend($ctrl.options, {
        delay: parseInt($ctrl.options.delay) || 0,
        minQualified: parseInt($ctrl.options.minQualified) || 0,
        leagueID: $ctrl.options.leagueID.length ? $ctrl.options.leagueID : 1
      });
    }

    /**
     * Notify the user of something, or of an error
     * @param message
     * @param error
     */
    function notify(message, error) {
      $ctrl.notice = {
        message: message,
        error: error
      };

      if (error) {
        $ctrl.loading = false;
      }
    }
  }
})();
