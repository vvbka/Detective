/**
 * js/ng-custom.js - detective
 * custom Angular directives, filters, etc...
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

$('[data-toggle=tooltip]').tooltip();

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

process.app.directive('ngRepeatEnd', function() {
  return function(scope, element, attrs) {
    if(scope.$last){
      //console.log('END OF REPEAT!');
        scope.$eval(attrs.ngRepeatEnd);
      
    }
  }
});

process.app.filter('double', function () {
  var nplaces = Math.pow(10, 2);
  return function (num) {
    return Math.round(nplaces * num) / nplaces;
  };
});
