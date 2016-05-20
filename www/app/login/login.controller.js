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
      if ($scope.team.text.toLowerCase() !== 'wca-dev')
      {
        popupAlert('Invalid Team Name', '<center>You need to enter a valid <br> team name to get started.</center>');
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
      popupAlert('Forgot Team?', '<center>This feature isn\'t implemented yet!</center>');
    }

    function createTeam()
    {
      popupAlert('Create Team', '<center>This feature isn\'t implemented yet!</center>');
    }

    function popupAlert(title, template)
    {
      $ionicPopup.alert({
        title: title,
        template: template
      });
    }
  }
})();