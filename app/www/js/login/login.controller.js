(function()
{
  angular
    .module('login')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$ionicPopup', 'FooseyService', 'SettingsService'];

  function LoginController($scope, $ionicPopup, FooseyService, SettingsService)
  {
    $scope.league = { text: '' };
    $scope.newLeague = { leagueName: '', playerName: '' };
    $scope.leagueChars = /[^0-9A-Za-z\-]/g;
    $scope.playerChars = /[^A-Za-z'. ]/g;

    $scope.login = login;
    $scope.forgot = forgot;
    $scope.createLeaguePopup = createLeaguePopup;
    $scope.addLeague = addLeague;

    function login()
    {
      var name = $scope.league.text.toLowerCase();

      FooseyService.getLeague(name).then(
        function(response)
        {
          if (response.data.error) 
          {
            popupAlert('Invalid League Name', '<center>You need to enter a valid <br> league name to get started.</center>');
            $scope.league.text = '';
            return;
          }
          else
          {
            SettingsService.logIn(response.data);
          }
        });
    }

    function forgot()
    {
      popupAlert('Forgot League?', '<center>This feature isn\'t implemented yet!</center>');
    }

    function popupAlert(title, template)
    {
      $ionicPopup.alert({
        title: title,
        template: template
      });
    }

    function createLeaguePopup()
    {
      $ionicPopup.show({
        title: 'Create League',
        subTitle: 'Enter a league name below',
        templateUrl: 'js/login/new-league.html',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.newLeague.leagueName || !$scope.newLeague.playerName) {
                //don't allow the user to save unless he enters league name
                e.preventDefault();
              } else {
                $scope.addLeague();
              }
            }
          }
        ]
      });
    }

    function addLeague()
    {
      FooseyService.addLeague($scope.newLeague.leagueName.toLowerCase()).then(
        function(response)
        {
          $scope.newLeague.leagueName = '';
          if (response.data.error)
          {
            popupAlert('Error', '<div class="text-center">League Already Exists</div>');
          }
          else
          {
            SettingsService.logIn(response.data);
            FooseyService.addPlayer(
            {
              displayName: $scope.newLeague.playerName,
              admin: true,
              active: true
            })
          }
        });
    }
  }
})();