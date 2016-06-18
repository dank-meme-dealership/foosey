(function()
{
  angular
    .module('gameList')
    .directive('gameList', gameList);

  function gameList()
  {
    var directive = {
      restrict    : 'EA',
      scope       : {
        title : '=',
        list  : '='
      },
      controller  : controller,
      templateUrl : 'app/game-list/game-list.html'
    }

    return directive;
  }

  controller.$inject = ['$scope', '$state', 'SettingsService'];

  function controller($scope, $state, SettingsService)
  {
    $scope.settings = SettingsService;

    $scope.show = show;

    $scope.$watchCollection('list', function(newVal)
    {
      if ($scope.title) 
        $scope.dates = [newVal];
      else
        $scope.dates = groupByDate(newVal);
    });

    // group the games by date
    function groupByDate(games)
    {
      return _.isArray(games) ? _.values(
        _.groupBy(games, 'date'), function(value, key) 
        { 
          value.date = key; return value; 
        }) : [];
    }

    // show the action sheet for deleting games
    function show(gameID) 
    {
      $state.go('app.game-detail', { gameID: gameID });
    };
  }
})();