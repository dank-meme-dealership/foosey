(function()
{
  angular
    .module('login')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$ionicViewService', '$state'];

  function LoginController($scope, $ionicViewService, $state)
  {
    $scope.login = login;
    $scope.forgot = login;
    $scope.signUp = login;

    function login()
    {
      $ionicViewService.nextViewOptions({
        disableBack: true
      });

      $state.go('app.leaderboard');
    }
  }
})();