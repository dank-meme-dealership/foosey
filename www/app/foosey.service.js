angular.module('foosey')
  .factory('FooseyService', function($http) 
  {
    var url = "https://run.blockspring.com/api_v2/blocks/foosey?api_key=br_4396_df06230a033b243b55fedbcd7fd3392d847df3bf";

	  return {

      // adds a game to the foosey csv
      addGame: function(game)
      {
        data =
        {
          text: game,
          user_name: "app",
          device: "app"
        }
        return $http.post(url, data);
      },

      // get chart data for a player
      charts: function(name)
      {
        data =
        {
          text: "charts " + name,
          device: "app"
        }
        return $http.post(url, data);
      },

      // gets a list of players and their elo ratings
      leaderboard: function()
      {
        data = 
        {
          text: "leaderboard",
          device: "app"
        };
        return $http.post(url, data);
      },

      // gets the full game history
      history: function(start, limit)
      {
        data = 
        {
          text: "history " + start + " " + limit,
          device: "app"
        };
        return $http.post(url, data);
      },

      // return a list of players
      players: function()
      {
        data = 
        {
          text: "players",
          device: "app"
        };
        return $http.post(url, data);
      },

      // remove specific game
      remove: function(id)
      {
        data = 
        {
          text: "remove " + id,
          device: "app"
        };
        return $http.post(url, data);
      },

      // get chart data for a player
      teamCharts: function()
      {
        data =
        {
          text: "team",
          device: "app"
        }
        return $http.post(url, data);
      },

      // undo last game
      undo: function()
      {
        data =
        {
          text: "undo"
        }
        return $http.post(url, data);
      }
    }
  });