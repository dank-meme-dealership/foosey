angular.module('Home')
  .factory('ApiService', function($http) 
  {
	
	 return {
      getList: function()
      {
        return $http.get('json/list.json');
      },
	 
      getInfo: function()
      {
        return $http.get('json/info.json');
      },
  
      getDetail: function()
      {
        return $http.get('json/detail.json');
      },
  
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