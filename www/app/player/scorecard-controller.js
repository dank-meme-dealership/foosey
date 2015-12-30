angular.module('player')
	.controller('ScorecardController', function($scope, $stateParams)
	{
		$scope.playerName = $stateParams.player;

	});