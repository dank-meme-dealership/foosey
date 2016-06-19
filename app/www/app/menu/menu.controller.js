(function()
{
  angular
    .module('foosey')
    .controller('MenuController', MenuController);

  MenuController.$inject = ['$scope', 'SettingsService'];

  function MenuController($scope, SettingsService)
  {
    $scope.settings = SettingsService;
  }

})();