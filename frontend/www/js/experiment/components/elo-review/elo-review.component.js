(function () {
  angular
    .module('foosey.review.eloReview', [])
    .component('eloReview', {
      templateUrl: 'components/elo-review/elo-review.tpl.html',
      controller: controller
    });

  function controller($timeout, allPlayers, allPlayersEloStats) {
    var $ctrl = this;

    $ctrl.DELAY = 70;
    $ctrl.MIN_QUALIFIED = 100;
    $ctrl.SORT_BY = 'elo';
    $ctrl.gameIndex = 0;

    $ctrl.init = init;
    $ctrl.changeSort = changeSort;

    function init() {
      // TODO: Replace allPlayers and allPlayersEloStats constants with network requests
      $ctrl.playerNameLookUp = getPlayerLookup(allPlayers);
      $ctrl.allGames = fixGameData(allPlayersEloStats);
      $ctrl.players = [];
      $ctrl.gameIndex = 0;

      setNextGame();
    }

    /**
     * Allow sorting by another field
     * @param field
     */
    function changeSort(field) {
      $ctrl.SORT_BY = field;
      doSort();
    }

    /**
     * Actually sort the list
     */
    function doSort() {
      // sort the players by elo rating bby default, but potentially game or name
      $ctrl.players = _.sortBy($ctrl.players, $ctrl.SORT_BY);

      // sorting by name should not be reversed, because A-Z makes more sense
      if ($ctrl.SORT_BY !== 'name') {
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

        // let's limit the number of games they had to play
        var minQualified = parseFloat($ctrl.MIN_QUALIFIED) || 0;
        if (player.elos.length >= minQualified) {
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
        $timeout(setNextGame, parseFloat($ctrl.DELAY));
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
  }
})();
