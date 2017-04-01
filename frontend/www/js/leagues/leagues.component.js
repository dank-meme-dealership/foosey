(function() {
  angular
    .module('foosey.leagues', [])
    .component('leagues', {
      templateUrl: 'js/leagues/leagues.html',
      controller: controller,
      bindings: {
        manage: '<'
      }
    });

  function controller(SettingsService, PlayerService)
  {
    var $ctrl = this;

    $ctrl.settings = SettingsService;

    $ctrl.selectLeague = selectLeague;

    function selectLeague(league) {
      SettingsService.logIn(league);
      PlayerService.updatePlayers();
    }
  }

})();
