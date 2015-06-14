/**
 * js/ng-custom.js - detective
 * custom Angular directives, filters, etc...
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

$('[data-toggle=tooltip]').tooltip();

// replace the native random number generator
// with something more secure
var securerandom = require('secure-random');
Math.random = function () {
  return parseFloat('0.' + parseInt(securerandom(6, {
    type: 'Buffer'
  }).toString('hex'), 16));
};

// an angular directive for handling return key presses
process.app.directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                        scope.$apply(function(){
                                scope.$eval(attrs.ngEnter);
                        });
                        
                        event.preventDefault();
                }
            });
        };
});

// an angular directive for handling the end of an ng-repeat
process.app.directive('ngRepeatEnd', function() {
  return function(scope, element, attrs) {
    if(scope.$last){
        scope.$eval(attrs.ngRepeatEnd);
    }
  };
});

// an angular filter for rounding doubles
process.app.filter('double', function () {
  var nplaces = Math.pow(10, 2);
  return function (num) {
    return Math.round(nplaces * num) / nplaces;
  };
});
