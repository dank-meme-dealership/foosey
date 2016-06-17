(function()
{
  angular
    .module('badges')
    .factory('BadgesService', BadgesService);

  BadgesService.$inject = ['FooseyService'];

  function BadgesService(FooseyService)
  {
    var skunks = [];
    var max = 0;
    var min = 0;
    var streaks = [];

    var service = {
      skunk: skunk,
      highest: highest,
      lowest: lowest,
      streak: streak,
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

          _.each(response, function(player)
          {
            max = player.dailyChange > max ? player.dailyChange : max;
            min = player.dailyChange < min ? player.dailyChange : min;

            updateStreak(player);
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
              var winningTeam = game.teams[0];
              if (_.includes(_.map(winningTeam.players, 'playerID'), player.playerID))
                streaks[player.playerID - 1]++
              else
                return false;
            });
        });
    }
  }
})();