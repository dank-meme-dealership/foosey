angular.module('foosey')
  .factory('FooseyService', function($http) 
  {
    var url = "https://run.blockspring.com/api_v2/blocks/foosey?api_key=br_4396_df06230a033b243b55fedbcd7fd3392d847df3bf";

	 return {

      addGame: function(game)
      {
        data =
        {
          text: game
        }
        return $http.post(url, data);
      },

      // gets a list of players and their elo ratings
      elo: function()
      {
        data = 
        {
          text: "elo",
          device: "app"
        };
        return $http.post(url, data);
      },

      // gets the full game history
      history: function()
      {
        data = 
        {
          text: "history",
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

      // undo last game
      undo: function()
      {
        data = 
        {
          text: "undo"
        };
        return $http.post(url, data);
      }
    }
  });