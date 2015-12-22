angular.module('foosey')
	.controller('HistoryController', function($scope, FooseyService)
	{
        // create a pull-to-refresh function
        $scope.refresh = refresh;

        // initialize the page
        $scope.refresh();
        $scope.loading = true;

        function refresh()
        {
		    // get history of games and group by the date
            FooseyService.history()
            .then(function successCallback(result) 
            { 
                $scope.dates = _.chain(result.data.games)
                    .groupBy('date')
                    .pairs()
                    .map(function (currentItem)
                    {
                      return _.object(_.zip(['date', 'games'], currentItem));
                    })
                    .value();
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
	});