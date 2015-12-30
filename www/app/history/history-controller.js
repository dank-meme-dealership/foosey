angular.module('history', [])
	.controller('HistoryController', function($scope, $ionicPopup, $ionicActionSheet, localStorage, FooseyService)
	{
        // some variables
        var loaded = 0;
        var gamesToLoad = 30;

        // create a pull-to-refresh function
        $scope.refresh = refresh;

        // initialize the page
        $scope.refresh();
        $scope.loading = true;

        // refresh page function
        function refresh()
        {
            // load from local storage
            $scope.dates = localStorage.getObject('history');

		    // get most recent games and group by the date
            FooseyService.history(0, gamesToLoad)
            .then(function successCallback(result) 
            { 
                // get games from server
                $scope.games = result.data.games;
                loaded += result.data.games.length;

                // sort the games by date
                $scope.dates = groupByDate($scope.games);

                // store them to local storage
                localStorage.setObject('history', $scope.dates);
                $scope.error = false;
                
                done();
            }, function errorCallback(response)
            {
                $scope.error = true;
                done();
            });
        }

        $scope.loadMore = function()
        {
            console.log("Loading new games starting from " + loaded + " to " + (loaded + gamesToLoad));
            FooseyService.history(loaded, loaded + gamesToLoad)
            .then(function successCallback(result)
            {
                // push new games to the end of the games list
                $scope.games.push.apply($scope.games, result.data.games);
                console.log("Loaded " + result.data.games.length);
                loaded += result.data.games.length;

                // see if we can load more games or not
                $scope.allLoaded = $scope.games[$scope.games.length - 1].id === 0;

                // sort the games by date
                $scope.dates = groupByDate($scope.games);
            
                // broadcast
                $scope.$broadcast('scroll.infiniteScrollComplete');
            })
        }

        // group the games by date
        function groupByDate(games)
        {
            return _.chain(games)
                    .groupBy('date')
                    .pairs()
                    .map(function (currentItem)
                    {
                      return _.object(_.zip(['date', 'games'], currentItem));
                    })
                    .value();
        }

        // turns off spinner and notifies
        function done()
        {
            $scope.loading = false;
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }

        // show the action sheet for deleting games
        $scope.show = function(game) 
        {
            // Show the action sheet
            $ionicActionSheet.show(
            {
                destructiveText: 'Remove Game',
                cancelText: 'Cancel',
                destructiveButtonClicked: function(index) 
                {
                    confirmRemove(game);
                    return true;
                }
            });
        };

        // confirm that they actually want to remove
        function confirmRemove(game)
        {
            var confirmPopup = $ionicPopup.confirm({
              title: 'Remove This Game',
              template: 'Are you sure you want to remove this game? This cannot be undone.'
            });

            // if yes, delete the last game
            confirmPopup.then(function(positive) {
              if(positive) {
                remove(game);
              }
            });
        }

        // Remove game
        function remove(game)
        {
            $scope.loading = true;
            FooseyService.remove(game.id)
            .then(function()
            {
                refresh();
            });
        }
	});