angular.module('foosey')

	// capitalize the first letter of a word
	.filter('capitalize', function() {
    return function(input) {
      return input.toLowerCase().replace( /\b\w/g, function (m) {
        return m.toUpperCase();
      });
    }
   })

	// 
	.filter('team', function()
	{
		return function(players)
		{
			// for one or two players
			if (players.length === 1) return players[0].name;
			if (players.length === 2) return players[0].name + " and " + players[1].name;

			// else, comma seperated list
			var teamName = "";
			var i = 0;
			while(i < players.length)
			{
				// if last one, add and with no comma
				if (i + 1 === players.length)
					teamName += "and " + players[i].name;
				else
					teamName += players[i].name + ", ";
				i++;
			}
			return teamName;
		}
	});