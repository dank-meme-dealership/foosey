(function()
{
	angular
		.module('addGame')
		.constant('gameTypes', [
			{
				name: "1 vs. 1",
				teams: 2,
				playersPerTeam: 1
			},
			{
				name: "2 vs. 2",
				teams: 2,
				playersPerTeam: 2
			},
			{
				name: "Trips",
				teams: 3,
				playersPerTeam: 1
			}
		]);
})();