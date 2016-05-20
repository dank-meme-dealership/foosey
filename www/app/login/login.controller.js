(function()
{
  angular
    .module('login')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$state', '$ionicViewService', '$ionicPopup'];

  function LoginController($scope, $state, $ionicViewService, $ionicPopup)
  {
    $scope.team = { text: '' };

    $scope.login = login;
    $scope.forgot = forgot;
    $scope.createTeam = createTeam;

    function login()
    {
      if ($scope.team.text !== 'wca-dev')
      {
        $scope.team.text = '';
        return;
      }

      $ionicViewService.nextViewOptions({
        disableBack: true
      });

      $state.go('app.leaderboard');
    }

    function forgot()
    {
      $ionicPopup.alert({
        title: 'Forgot Team?',
        template: '<center>This feature isn\'t implemented yet!</center>'
      });
    }

    function createTeam()
    {
      $ionicPopup.alert({
        title: 'Create Team',
        template: '<center>This feature isn\'t implemented yet!</center>'
      });
    }
  }
})();