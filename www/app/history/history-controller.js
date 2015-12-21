angular.module('foosey')
	.controller('HistoryController', function($scope, FooseyService)
	{
		// get history of games and group by the date
    FooseyService.history().then(function(result) { 
      $scope.dates = _.chain(result.data.games)
        .groupBy('date')
        .pairs()
        .map(function (currentItem)
        {
          return _.object(_.zip(['date', 'games'], currentItem));
        })
        .value();
    });
	});