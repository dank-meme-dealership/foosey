(function()
{
  angular
    .module('datepicker')
    .directive('datepicker', function() {
      return {
        require: 'ngModel',
        link: function(scope, el, attr, ngModel) {
          $(el).datepicker({
            onSelect: function(dateText) {
              scope.$apply(function() {
                ngModel.$setViewValue(dateText);
              });
            }
          });
        }
      };
    });

})();