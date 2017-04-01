(function() {
  angular
    .module('foosey.leaderboard.leagueStats', [])
    .component('leagueStats', {
      templateUrl: 'js/leaderboard/league-stats/league-stats.tpl.html',
      controller: LeagueStatsController
    });

  function LeagueStatsController(PlayerService, FooseyService, localStorage) {
    var $ctrl = this;

    $ctrl.players = PlayerService;
    $ctrl.games = localStorage.getArray('allGames');

    FooseyService.getAllGames().then(function(response) {
      $ctrl.games = response;
      localStorage.setArray('allGames', $ctrl.games);
    });
  }
})();
