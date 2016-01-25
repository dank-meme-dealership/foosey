angular
	.module('foosey')
  .config(config);

function config($stateProvider)
{
  $stateProvider
    .state('app', {
      url         : '/app',
      abstract    : true,
      templateUrl : 'app/menu/menu.html'
    });
}