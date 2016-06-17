(function()
{
  angular
    .module('settings')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', 'localStorage', 'FooseyService', 'SettingsService'];

  function SettingsController($scope, localStorage, FooseyService, SettingsService)
  {
    $scope.settings = SettingsService;
    $scope.players = [];
    $scope.playerSelections = [];
    $scope.player = {};
    $scope.player.selected = SettingsService.playerID;

    $scope.addTestCard = addTestCard;

    // load on entering view 
    $scope.$on('$ionicView.beforeEnter', function()
    {
      // send to login screen if they haven't logged in yet
      if (!SettingsService.loggedIn) SettingsService.logOut();
      loadPlayers();
    });

    $scope.$watch('player.selected', function(player)
    {
      if (_.isUndefined(player)) return;
      SettingsService.setPlayer(player);
    });

    function loadPlayers()
    {
      // load from server
      FooseyService.getAllPlayers(false).then(
        function (players)
        { 
          $scope.players = players.sort(function(a, b){
            return a.displayName.localeCompare(b.displayName);
          });
          // filter the player selections that you can choose to just the active players
          $scope.playerSelections = _.filter($scope.players, function(player){ return player.active });
        });
    }

    function addTestCard()
    {
      // localStorage.set('trello_token', '');

      var authenticationSuccess = function() { 
        var myList = '56818395c4f82ddd78cc0050';
        var creationSuccess = function(data) {
          console.log('Card created successfully. Data returned:' + JSON.stringify(data));
        };
        var newCard = {
          name: 'New Test Card', 
          desc: 'This is the description of our new card.',
          // Place this card at the top of our list 
          idList: myList,
          pos: 'top'
        };
        Trello.post('/cards/', newCard, creationSuccess);
      };
      var authenticationFailure = function() { console.log('Failed authentication'); };

      Trello.authorize({
        type: 'popup',
        name: 'Getting Started Application',
        scope: {
          read: true,
          write: true 
        },
        expiration: 'never',
        success: authenticationSuccess,
        error: authenticationFailure
      });
    }
  }
})();