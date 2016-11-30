(function()
{
  angular
    .module('history')
    .controller('HistoryController', HistoryController);

  HistoryController.$inject = ['$scope', '$state', 'localStorage', 'HistoryService', 'SettingsService'];

  function HistoryController($scope, $state, localStorage, HistoryService, SettingsService)
  {
    $scope.history = HistoryService;
    $scope.filter = filter;
    $scope.loadMore = loadMore;
    $scope.refresh = refresh;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.reallyLogOut();
      refresh();
    });

    function filter()
    {
      console.log('Filter yo');
    }

    function loadMore()
    {
      // this is necessary because the loadMore function may just
      // return if there are no games loaded yet, so we can't expect
      // a promise, so we must check for one.
      var loadMore = HistoryService.loadMore();
      if (loadMore) loadMore.then(done);
    }

    function refresh()
    {
      HistoryService.refresh().then(done); 
    }

    function done()
    {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }
  }
})();