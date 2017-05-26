(function () {
  angular
    .module('foosey.badges', [])
    .component('badges', {
      template: '<div class="badges" ng-repeat="badge in $ctrl.service.myBadges($ctrl.player.playerID)" ng-bind-html="badge.emoji | twemoji"></div>',
      controller: controller,
      bindings: {
        player: '<'
      }
    });

  function controller(BadgesService) {
    var $ctrl = this;

    $ctrl.service = BadgesService;
  }
})();