(function()
{
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', 'FooseyService', 'SettingsService'];

  function SettingsController($scope, FooseyService, SettingsService)
  {
  	$scope.settings = SettingsService;
  }
})();