(function () {
  angular
    .module('foosey.addGame')
    .constant('gameTypes', [
      {
        name: "1 vs. 1",
        teams: 2,
        playersPerTeam: 1,
        totalPlayers: 2
      },
      {
        name: "2 vs. 2",
        teams: 2,
        playersPerTeam: 2,
        totalPlayers: 4
      }
    ]);
})();