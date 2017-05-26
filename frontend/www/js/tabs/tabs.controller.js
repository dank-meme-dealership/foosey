(function () {
  angular
    .module('foosey')
    .controller('TabsController', TabsController);

  function TabsController($scope, SettingsService) {
    $scope.settings = SettingsService;
  }
})();
