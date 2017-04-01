(function() {
  angular
    .module('keylistener')
    .directive('keylistener', keylistener);

  function keylistener($document, $rootScope, $ionicPopup) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link() {
      var captured = [];

      $document.bind('keydown', function(e) {
        $rootScope.$broadcast('keydown', e);
        $rootScope.$broadcast('keydown:' + e.which, e);

        // check nerd
        captured.push(e.which)
        if (arrayEndsWith(captured, [38, 38, 40, 40, 37, 39, 37, 39, 66, 65])) nerd();
      });
    }

    function arrayEndsWith(a, b) {
      a = a.slice(a.length - b.length, a.length);
      if (a.length !== b.length) return;
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    function nerd() {
      captured = [];
      document.getElementsByTagName('body')[0].className += ' nerd';
      $ionicPopup.alert({title:'You\'re a nerd 🤓', buttons:[{text: 'I know', type: 'button-positive'}]});
    }
  }
})();
