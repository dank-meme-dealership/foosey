angular.module('foosey')
  .factory('FooseyService', function($http) 
  {
    var url = "http://api.foosey.futbol/app";

	  var service =  {
      addGame: addGame,
      charts: charts,
      leaderboard: leaderboard,
      history: history,
      players: players,
      remove: remove,
      teamCharts: teamCharts,
      undo: undo
    }

    return service;

    // adds a game to the foosey csv
    function addGame(game)
    {
      data =
      {
        text: game,
        user_name: "app",
        device: "app"
      }
      return $http.post(url, data);
    }

    // get chart data for a player
    function charts(name)
    {
      data =
      {
        text: "charts " + name,
        device: "app"
      }
      return $http.post(url, data);
    }

    // gets a list of players and their elo ratings
    function leaderboard()
    {
      data = 
      {
        text: 'leaderboard',
        device: 'app'
      };
      return $http.post(url, data);
    }

    // gets the full game history
    function history(start, limit)
    {
      data = 
      {
        text: "history " + start + " " + limit,
        device: "app"
      };
      return $http.post(url, data);
    }

    // return a list of players
    function players()
    {
      data = 
      {
        text: "players",
        device: "app"
      };
      return $http.post(url, data);
    }

    // remove specific game
    function remove(id)
    {
      data = 
      {
        text: "remove " + id,
        device: "app"
      };
      return $http.post(url, data);
    }

    // get chart data for a player
    function teamCharts()
    {
      data =
      {
        text: "team",
        device: "app"
      }
      return $http.post(url, data);
    }

    // undo last game
    function undo()
    {
      data =
      {
        text: "undo"
      }
      return $http.post(url, data);
    }

  });