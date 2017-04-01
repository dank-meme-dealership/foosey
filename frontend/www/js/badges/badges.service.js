(function()
{
  angular
    .module('foosey.badges')
    .factory('BadgesService', BadgesService);

  BadgesService.$inject = ['localStorage', 'FooseyService'];

  function BadgesService(localStorage, FooseyService)
  {
    var allPlayers = localStorage.getObject('playerBadges');

    var service = {
      myBadges: myBadges,
      updateBadges: updateBadges
    }

    return service;

    // get the badges for a player
    function myBadges(playerID)
    {
      var mine = [];
      _.each(allPlayers, function(player)
      {
        if (player.playerID === playerID) mine = player.badges;
      })
      return mine;
    };

    // update the badges service
    function updateBadges()
    {
      FooseyService.getBadges().then(
        function successCallback(response)
        {
          allPlayers = response.data;
          localStorage.setObject('playerBadges', response.data);
        });
    }
  }
})();