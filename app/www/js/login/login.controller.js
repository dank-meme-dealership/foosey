(function()
{
  angular
    .module('login')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$ionicPopup', 'FooseyService', 'SettingsService'];

  function LoginController($scope, $ionicPopup, FooseyService, SettingsService)
  {
    $scope.team = { text: '' };
    $scope.newTeam = { text: '' };
    $scope.allowedChars = /[^0-9A-Za-z\a-]/g;

    $scope.login = login;
    $scope.forgot = forgot;
    $scope.createTeamPopup = createTeamPopup;

    function login()
    {
      var name = $scope.team.text.toLowerCase();

      FooseyService.getLeague(name === 'wca-admin' ? 'wca-dev' : name).then(
        function(response)
        {
          if (response.data.error) 
          {
            popupAlert('Invalid League Name', '<center>You need to enter a valid <br> league name to get started.</center>');
            $scope.team.text = '';
            return;
          }
          else
          {
            SettingsService.logIn(response.data, name === 'wca-admin');
          }
        });
    }

    function forgot()
    {
      popupAlert('Forgot Team?', '<center>This feature isn\'t implemented yet!</center>');
    }

    function popupAlert(title, template)
    {
      $ionicPopup.alert({
        title: title,
        template: template
      });
    }

    function createTeamPopup()
    {
      $ionicPopup.show({
        title: 'Create Team',
        subTitle: 'Enter a team name below',
        template: '<input class="text-center" ng-model="newTeam.text" ng-trim="false" ng-change="newTeam.text = newTeam.text.replace(allowedChars, \'\')" type="text">',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.newTeam.text) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();
              } else {
                FooseyService.addLeague($scope.newTeam.text).then(
                  function(response)
                  {
                    $scope.newTeam.text = '';
                    if (response.data.error)
                    {
                      popupAlert('Error', '<div class="text-center">League Already Exists</div>');
                    }
                  })
              }
            }
          }
        ]
      });
    }
  }
})();