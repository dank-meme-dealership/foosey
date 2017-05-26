(function () {
  angular
    .module('focusOn', [])
    .directive('focusOn', focusOn);

  function focusOn($timeout) {
    return function (scope, elem, attr) {
      scope.$on(attr.focusOn, function (e) {
        $timeout(function () {
          elem[0].focus();
          elem[0].select();
        });
      });
    };
  }
})();