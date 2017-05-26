(function () {
  angular
    .module('foosey.gameList')
    .directive('gameList', gameList);

  function gameList() {
    var directive = {
      restrict: 'EA',
      scope: {
        title: '=',
        list: '=',
        gameCount: '=',
        highlight: '=',
        edit: '=',
        disabled: '='
      },
      controller: controller,
      templateUrl: 'js/game-list/game-list.html'
    };

    return directive;
  }

  function controller($scope, $state, SettingsService) {
    $scope.settings = SettingsService;

    $scope.editGame = editGame;
    $scope.gameDetail = gameDetail;

    $scope.$watchCollection('list', function (newVal) {
      if ($scope.title) $scope.dates = [newVal];
      else $scope.dates = groupByDate(newVal);
    });

    // group the games by date
    function groupByDate(games) {
      return _.isArray(games) ? _.values(
        _.groupBy(games, 'date'), function (value, key) {
          value.date = key;
          return value;
        }) : [];
    }

    function editGame(gameID) {
      if ($scope.disabled) alert('Wait one sec');
      else $state.go($state.current.name + '-edit-game', {gameID: gameID});
    }

    function gameDetail(gameID) {
      var state = _.includes($state.current.name, 'game-detail') ? $state.current.name : $state.current.name + '-game-detail';
      $state.go(state, {gameID: gameID});
    }
  }
})();
