(function()
{
  angular
    .module('foosey')
    .controller('TabsController', TabsController);

  TabsController.$inject = ['$scope', 'SettingsService'];

  function TabsController($scope, SettingsService)
  {
    $scope.settings = SettingsService;
  }

})();