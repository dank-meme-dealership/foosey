angular.module('foosey')
	.controller('HistoryController', function($scope, $ionicPopup, localStorage, FooseyService)
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

        /// confirm that they actually want to remove
        $scope.confirmRemove = function()
        {
            var confirmPopup = $ionicPopup.confirm({
              title: 'Remove Last Game',
              template: 'Are you sure you want to remove the last game? This cannot be undone.'
            });

            // if yes, delete the last game
            confirmPopup.then(function(positive) {
              if(positive) {
                removeLast();
              }
            });
        }

        // Remove game
        function removeLast()
        {
            $scope.loading = true;
            FooseyService.undo().then(function() 
            {
                refresh();
            });
        }
	});