(function () {
  angular
    .module('ionic.utils', [])
    .factory('localStorage', localStorage);

  function localStorage($window) {
    return {
      set: set,
      get: get,
      setObject: setObject,
      getObject: getObject,
      setArray: setArray,
      getArray: getArray
    };

    function set(key, value) {
      $window.localStorage[key] = value;
    }

    function get(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    }

    function setObject(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    }

    function getObject(key, defaultValue) {
      return $window.localStorage[key] === "undefined" ? {} : JSON.parse($window.localStorage[key] || (_.isUndefined(defaultValue) ? '{}' : defaultValue));
    }

    function setArray(key, value) {
      this.setObject(key, value);
    }

    function getArray(key) {
      return JSON.parse($window.localStorage[key] || '[]');
    }
  }
})();
