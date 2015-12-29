angular.module('history', [])
	.controller('HistoryController', function($scope, $ionicPopup, $ionicActionSheet, localStorage, FooseyService)
	{
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

		    // get history of games and group by the date
            FooseyService.history()
            .then(function successCallback(result) 
            { 
                // get dates from server
                $scope.dates = _.chain(result.data.games)
                    .groupBy('date')
                    .pairs()
                    .map(function (currentItem)
                    {
                      return _.object(_.zip(['date', 'games'], currentItem));
                    })
                    .value();

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

        // turns off spinner and notifies
        function done()
        {
            $scope.loading = false;
            $scope.$broadcast('scroll.refreshComplete');
        }

        $scope.show = function(game) 
        {
            // Show the action sheet
            $ionicActionSheet.show(
            {
                destructiveText: 'Remove Game',
                cancelText: 'Cancel',
                destructiveButtonClicked: function(index) 
                {
                    confirmRemove(game.id);
                    return true;
                }
            });
        };

        // confirm that they actually want to remove
        function confirmRemove(id)
        {
            var confirmPopup = $ionicPopup.confirm({
              title: 'Remove This Game',
              template: 'Are you sure you want to remove this game? This cannot be undone.'
            });

            // if yes, delete the last game
            confirmPopup.then(function(positive) {
              if(positive) {
                remove(id);
              }
            });
        }

        // Remove game
        function remove(id)
        {
            $scope.loading = true;
            FooseyService.remove(id)
            .then(function()
            {
                refresh();
            });
        }
	});