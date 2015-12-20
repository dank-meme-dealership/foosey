angular.module('Home')
  .controller("HomeCtrl", function ($scope, $http, $filter, $ionicScrollDelegate, $timeout, ApiService) 
  {
    // initialize some things
    $scope.detail = {};
    $scope.info = {};
    $scope.list = {};
    $scope.selected = {};
    $scope.showDetails = false;
    $scope.tab = 1;
	
    // gets details
    ApiService.getDetail().then(function(result) {
      $scope.detail = result.data;
    });
	
    // get info
    ApiService.getInfo().then(function(result) {
      $scope.info = result.data;
    });
	
    // get list of metrics
    ApiService.getList().then(function(result) {
      $scope.list = result.data;
    });

    // get foosey
    ApiService.foosey().then(function(result) { 
      console.log(result);
    });
    
    // close the details drawer
    $scope.closeDetails = function() 
    {
      $scope.showDetails = false;
      $scope.selected = {};

      // scroll down the height of the drawer when you close it
      // if ($scope.scrollBack)
      //   $ionicScrollDelegate.scrollBottom(true);
      $ionicScrollDelegate.scrollBy(0, -239, true)
      $scope.scrollBack = false;
    }
    
    // select which metric we should see in the drawer
    $scope.selectMetric = function(entry) 
    {
      // calculate the lowest position you can scroll to
      if (!$scope.lowest)
      {
        // find the last item
        var items = $("ion-item");
        var last = items[items.length - 1];

        // lowest spot is the last element's offset - 239 for drawer height + 94 for ion item height
        $scope.lowest = last.offsetTop + last.offsetParent.offsetTop - window.innerHeight + 239 + 94;
      }

      // if it's already selected and you tap again, hide it
      if ($scope.selected.metricCode === entry.metricCode)
      {
        $scope.closeDetails();
      }
      // otherwise show the new metric
      else
      {
        $scope.showDetails = true;
        $scope.selected = entry;

        // Very hacky way to "simulate" getting the view to update without making a call out to the server
        $scope.detail.detailsRows[0].prefix = entry.denom;
        $scope.detail.detailsRows[1].prefix = entry.num;
        $scope.detail.detailsRows[2].prefix = $filter('number')(entry.rate * 100, 0) + '%';
        $scope.detail.detailsRows[3].prefix = $filter('number')(entry.peerRate * 100, 0) + '%';
        $scope.detail.detailsRows[4].prefix = entry.target ? $filter('number')(entry.target * 100, 0) + '%' : "None";

        // scroll to newly selected div
        scroll(entry);
      }
      
      $scope.tab = 1;
    }

    // scroll to a metric
    function scroll(entry)
    {
      // calculate this entry's position on the screen
      var div = document.getElementById(entry.metricCode)
      var position = div.offsetParent.offsetTop + div.offsetTop;

      // scroll to that position
      if (position < $scope.lowest)
        $ionicScrollDelegate.scrollTo(0, position, true);
      // or to the bottom if that position is too low
      else
      {
        $scope.scrollBack = true;
        $ionicScrollDelegate.scrollBottom(true);
      }
    }
    
    // set which tab we're looking at
    $scope.setTab = function(tab) {
      $scope.tab = tab;
    }

  });
