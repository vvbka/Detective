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