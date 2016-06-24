(function()
{
  angular
    .module('login')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$ionicPopup', 'FooseyService', 'SettingsService'];

  function LoginController($scope, $ionicPopup, FooseyService, SettingsService)
  {
    $scope.team = { text: '' };

    $scope.login = login;
    $scope.forgot = forgot;
    $scope.createTeam = createTeam;
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

    function createTeam()
    {
      popupAlert('Create Team', '<center>Hey! We\'re glad you\'re interested in trying out Foosey! We are currently testing with a few teams and will be adding new teams shortly. If you\'d like us to reach out to you when we\'re ready for you to join: <div><a href="mailto:mtaylor@whitecloud.com?Subject=Foosey%20App&cc=brik@whitecloud.com&Body=Hello%2C%20I%20am%20interested%20in%20using%20Foosey%20for%20my%20team!" target="_top">Send us an email!</a></div></center>');
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
        template: '<input ng-model="team.text">',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.team.text) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();
              } else {
                console.log($scope.team.text);
              }
            }
          }
        ]
      });
    }
  }
})();