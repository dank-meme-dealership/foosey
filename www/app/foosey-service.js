angular.module('foosey')
  .factory('FooseyService', function($http) 
  {
	 return {

      // gets a list of players and their elo ratings
      elo: function()
      {
        data = 
        {
          text: "elo",
          device: "app"
        };
        url = "https://run.blockspring.com/api_v2/blocks/foosey?api_key=br_4396_df06230a033b243b55fedbcd7fd3392d847df3bf";
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
        url = "https://run.blockspring.com/api_v2/blocks/foosey?api_key=br_4396_df06230a033b243b55fedbcd7fd3392d847df3bf";
        return $http.post(url, data);
      }
    }
  });