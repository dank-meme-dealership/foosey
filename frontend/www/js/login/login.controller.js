(function () {
  angular
    .module('login')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$state', '$ionicPopup', '$ionicModal', '$ionicHistory', 'FooseyService', 'SettingsService'];

  function LoginController($scope, $state, $ionicPopup, $ionicModal, $ionicHistory, FooseyService, SettingsService) {
    $scope.league = {text: '', leagueID: ''};
    $scope.newLeague = {leagueName: '', displayName: '', playerName: ''};
    $scope.players = [];
    $scope.leagueChars = /[^0-9A-Za-z\-]/g;
    $scope.playerChars = /[^A-Za-z'. ]/g;
    $scope.settings = SettingsService;
    $scope.validating = false;

    $scope.getStarted = getStarted;
    $scope.forgot = forgot;
    $scope.createLeaguePopup = createLeaguePopup;
    $scope.addLeague = addLeague;

    // load up add/edit player modal
    $ionicModal.fromTemplateUrl('js/login/new-league.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    function getStarted() {
      // validate that the league exists on the server
      var name = $scope.league.text.toLowerCase();
      $scope.validating = true;
      FooseyService.getLeague(name).then(
        function (response) {
          if (response.data.error) {
            popupAlert('Invalid League Name', '<center>You need to enter a valid <br> league name to get started.</center>');
            $scope.league.text = '';
            return;
          }
          else {
            $state.go('choose-player', {name: $scope.league.text});
            doneValidating();
          }
        });
    }

    function forgot() {
      popupAlert('Forgot League?', '<center>This feature isn\'t implemented yet!</center>');
    }

    function popupAlert(title, template) {
      $ionicPopup.alert({
        title: title,
        template: template
      }).then(doneValidating);
    }

    function doneValidating(res) {
      $scope.validating = false;
    }

    function createLeaguePopup() {
      $scope.modal.show();
    }

    function addLeague() {
      $scope.modal.hide();
      FooseyService.addLeague($scope.newLeague).then(
        function (response) {
          $scope.newLeague.leagueName = '';
          if (response.data.error) {
            popupAlert('Error', '<div class="text-center">League Already Exists</div>');
          }
          else {
            var league = response.data;
            FooseyService.addPlayer(
              {
                displayName: $scope.newLeague.playerName,
                admin: true,
                active: true
              }, league.leagueID).then(function (response) {
              league.player = response.data;
              SettingsService.logIn(league);
              $state.go('app.leaderboard');
            })
          }
        });
    }
  }
})();