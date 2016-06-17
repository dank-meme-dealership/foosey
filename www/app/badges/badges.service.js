(function()
{
  angular
    .module('badges')
    .factory('BadgesService', BadgesService);

  BadgesService.$inject = ['FooseyService'];

  function BadgesService(FooseyService)
  {
    var skunks = [];
    var streaks = [];
    var againstOddsList = [];
    var max = 0;
    var min = 0;

    var service = {
      skunk: skunk,
      highest: highest,
      lowest: lowest,
      streak: streak,
      againstOdds: againstOdds,
      updateBadges: updateBadges
    }

    return service;

    function skunk(playerID)
    {
      return _.includes(skunks, playerID);
    }

    function highest(dailyChange)
    {
      return max > 0 && dailyChange === max;
    }

    function lowest(dailyChange)
    {
      return min < 0 && dailyChange === min;
    }

    function streak(playerID)
    {
      return streaks.length > 0 ? streaks[playerID - 1] : 0;
    }

    function againstOdds(playerID)
    {
      return againstOddsList.length > 0 ? againstOddsList[playerID - 1] : 0;
    }

    function updateBadges()
    {
      updateSkunk();
      updateHighestLowest();
    }

    function updateSkunk()
    {
      FooseyService.getGames(100, 0).then(
        function(response)
        {
          _.each(response, function(game)
          {
            var losingTeam = game.teams[game.teams.length - 1];
            if (losingTeam.score === 0)
            {
              skunks = _.map(losingTeam.players, 'playerID');
              return false;
            }
          })
        });
    }

    function updateHighestLowest()
    {
      max = 0;
      min = 0;

      FooseyService.getAllPlayers().then(
        function(response)
        {
          streaks = _.times(response.length, _.constant(0));
          againstOdds = _.times(response.length, _.constant(false));

          _.each(response, function(player)
          {
            max = player.dailyChange > max ? player.dailyChange : max;
            min = player.dailyChange < min ? player.dailyChange : min;

            updateStreak(player);
            updateAgainstOdds(player);
          })
        });
    }

    function updateStreak(player)
    {
      FooseyService.getPlayerGames(player.playerID).then(
        function(response)
        {
          _.each(response.data, function(game)
            {
              if (winner(player, game))
                streaks[player.playerID - 1]++
              else
                return false;
            });
        });
    }

    function updateAgainstOdds(player)
    {
      FooseyService.getPlayerGames(player.playerID, 1).then(
        function(response)
        {
          if (response.data.length === 0) return
          var losingTeam = response.data[0].teams[response.data[0].teams.length - 1];
          if (winner(player, response.data[0]) && losingTeam.delta > 0)
            againstOddsList[player.playerID - 1] = true;
        });
    }

    function winner(player, game)
    {
      var winningTeam = game.teams[0];
      return _.includes(_.map(winningTeam.players, 'playerID'), player.playerID);
    }
  }
})();