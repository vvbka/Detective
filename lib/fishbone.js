
// Fishbone.js
//
// Version: 1.0.1
// URL: https://github.com/aemkei/fishbone.js
// Author: Martin Kleppe <kleppe@ubilabs.net>
// License: WTFPL

Model =

function _(
  object, // module definition
  key, value, // placeholder
  undefined
){

  // return class constructor
  function Klass(){
    
    // references used across instance
    var target = this;

    // cycle through all properties
    for (key in object) {
      value = object[key];
        
      // test if value is a function
      target[key] = (typeof value == 'function') ?

        // wrap method
        function(){
          // add chainablity if nothing was returned
          return (
            // keep the original context
            value = this.apply(target, arguments)
          ) === undefined ? target : value;
        }.bind(value) :
      
        // copy property
        value;
    }

    target.init && target.init.apply(target, arguments);
  }

  // allow class to be extended
  Klass.extend = function(overrides){
    
    value = {};

    // copy all object properties
    for (key in object){
      value[key] = object[key];
    }

    // override object properties
    for (key in overrides){
      value[key] = overrides[key];
      
      // store reference to super properties
      object[key] !== undefined && (
        value["__" + key] = object[key]
      );
    }

    return _(value);
  };

  return Klass;
};

// make module Node.js compatible
if (typeof module == "object") {
  module.exports = Model;
}
