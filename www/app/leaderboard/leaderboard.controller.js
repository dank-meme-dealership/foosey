(function()
{
  angular
    .module('leaderboard')
    .controller('LeaderboardController', LeaderboardController);

  LeaderboardController.$inject = ['$scope', 'localStorage', '$ionicSlideBoxDelegate', 'FooseyService', 'SettingsService'];

  function LeaderboardController($scope, localStorage, $ionicSlideBoxDelegate, FooseyService, SettingsService) 
  {
    // initialize the page
    $scope.slide = 0;
    $scope.loading = true;
    $scope.minimumQualified = 10;
    $scope.showElo = SettingsService.showElo;

    $scope.getStats = getStats;
    $scope.changeSlide = changeSlide;
    $scope.slideTo = slideTo;

    getStats();

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
      $scope.players = localStorage.getObject('leaderboard');

      // load from server
      FooseyService.getAllPlayers().then(
        function successCallback(players)
        { 
          $scope.players = filterPlayers(players);
          $ionicSlideBoxDelegate.update();
          localStorage.setObject('leaderboard', $scope.players);
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
    function filterPlayers(players)
    {
      var filteredElos = [];
      var unranked = [];
      var rank = 1;

      players.sort(sortElos);

      // set rank and if they're qualified
      for (var i = 0; i < players.length; i++)
      {
        // Remove people from the leaderboard who haven't played or are inactive
        if (players[i].gamesPlayed == 0 || !players[i].active) continue;

        if (players[i].gamesPlayed >= $scope.minimumQualified)
        {
          players[i].rank = rank;
          players[i].qualified = true;
          rank++;
          filteredElos.push(players[i]);
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
        filteredElos.push(unranked[i]);
      }

      return filteredElos;
    }

    function sortElos(a, b)
    {
      return b.elo - a.elo;
    }

    // turns off spinner and notifies
    function done()
    {
      $scope.loading = false;
      $scope.$broadcast('scroll.refreshComplete');
    }
  }
})();