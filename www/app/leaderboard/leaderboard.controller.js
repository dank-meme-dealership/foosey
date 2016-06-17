(function()
{
  angular
    .module('leaderboard')
    .controller('LeaderboardController', LeaderboardController);

  LeaderboardController.$inject = ['$scope', 'localStorage', '$ionicSlideBoxDelegate', 'FooseyService', 'SettingsService', 'BadgesService'];

  function LeaderboardController($scope, localStorage, $ionicSlideBoxDelegate, FooseyService, SettingsService, BadgesService) 
  {
    $scope.settings = SettingsService;
    $scope.badges = BadgesService;
    $scope.slide = 0;
    $scope.loading = true;
    $scope.minimumQualified = 10;
    $scope.elos = undefined;
    $scope.winRates = undefined;

    $scope.getStats = getStats;
    $scope.changeSlide = changeSlide;
    $scope.slideTo = slideTo;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      BadgesService.updateBadges();
      getStats();
    });

    // function for swiping between views
    function changeSlide(index)
    {
      $scope.slide = index;
    }

    function slideTo(index)
    {
      $ionicSlideBoxDelegate.slide(index);
    }

    // gets the list of names and elos
    function getStats()
    {
      // load from local storage
      $scope.elos = localStorage.getObject('elos');
      $scope.winRates = localStorage.getObject('winRates');

      // load from server
      FooseyService.getAllPlayers(true).then(
        function successCallback(players)
        { 
          // Remove people from the leaderboard who haven't played or are inactive
          var players = _.filter(players, hasPlayed)

          $scope.elos = getEloRank(players);
          $scope.winRates = players.sort(sortWinRate);
          $ionicSlideBoxDelegate.update();
          localStorage.setObject('elos', $scope.elos);
          localStorage.setObject('winRates', $scope.winRates);
          $scope.error = false;

          done();
        }, 
        function errorCallback(response)
        {
          $scope.error = true;
          done();
        });
    }

    // filters out people that have not yet played enough games
    function getEloRank(players)
    {
      var eloRank = [];
      var unranked = [];
      var rank = 1;

      players.sort(sortElos);

      // set rank and if they're qualified
      for (var i = 0; i < players.length; i++)
      {
        if (players[i].gamesPlayed >= $scope.minimumQualified)
        {
          players[i].rank = rank;
          players[i].qualified = true;
          rank++;
          eloRank.push(players[i]);
        }
        else
        {
          players[i].disqualified = true;
          players[i].rank = '-';
          unranked.push(players[i]);
        }
      }

      // add unranked to bottom
      for (var i = 0; i < unranked.length; i++)
      {
        eloRank.push(unranked[i]);
      }

      return eloRank;
    }

    function hasPlayed(player)
    {
      return player.gamesPlayed > 0;
    }

    function sortElos(a, b)
    {
      return b.elo - a.elo;
    }

    function sortWinRate(a, b)
    {
      return b.winRate - a.winRate;
    }

    // turns off spinner and notifies
    function done()
    {
      $scope.loading = false;
      $scope.$broadcast('scroll.refreshComplete');
    }
  }
})();