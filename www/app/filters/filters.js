angular
	.module('foosey')

	// replace & with And
	.filter('and', and)

	// capitalize the first letter of a word
	.filter('capitalize', capitalize)

	// capitalize the first letter of a word
	.filter('date', date)

	// format the elo change for the day
	.filter('eloChange', eloChange)

	// format 0.9857 into 98.6%
	.filter('percent', percent)

	// nice string for teams
	.filter('team', team)

	// convert from 24-hour to am/pm
	.filter('time', time);

function and()
{
	return function(str)
	{
		return str.split('&').join(' & ');
	}
}

function capitalize() 
{
  return function(input) {
    return input.toLowerCase().replace( /\b\w/g, function (m) {
      return m.toUpperCase();
    });
  }
}

function date() 
{
  return function(input) {
  	var date = new Date();
	  var today = ("0" + (date.getMonth() + 1).toString()).substr(-2) + "/" + ("0" + date.getDate().toString()).substr(-2)  + "/" + (date.getFullYear().toString());
	  
    if (input === today) return 'Today';
    return input;
  }
}

function eloChange()
{
	return function(input)
	{
		if (input === undefined || input === null) return '';
		plusOrMinus = input < 0 ? input : '+' + input
		return '(' + plusOrMinus + ')';
	}
}

function percent()
{
	return function(decimal)
	{
		return (demical * 100) + '%';
	}
}

function team()
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
}

function time()
{
	return function(time)
	{
		var hours = time.split(":")[0];
		var mins = time.split(":")[1];
		var ampm = hours < 12 ? "am" : "pm";
		hours = hours == 0 || hours == 12 ? 12 : hours % 12;

		return hours + ":" + mins + ampm;
	}
}