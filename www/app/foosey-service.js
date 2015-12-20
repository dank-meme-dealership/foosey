angular.module('foosey')
  .factory('FooseyService', function($http) 
  {
	 return {

      foosey: function()
      {
        data = 
        {
          text: "stats",
          user_name: "matttt",
          channel_name: "foosey",
          device: "app"
        };
        url = "https://run.blockspring.com/api_v2/blocks/foosey?api_key=br_4396_df06230a033b243b55fedbcd7fd3392d847df3bf";
        return $http.post(url, data);
      }
    }
  });