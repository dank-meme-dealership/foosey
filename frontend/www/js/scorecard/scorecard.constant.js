(function () {
  angular
    .module('scorecard')
    .constant('scorecardInfo', {
      ally: 'Your ally is the player who you have won the most with in doubles.',
      nemesis: 'Your nemesis is the player who has beaten you the most in singles.'
    });
})();