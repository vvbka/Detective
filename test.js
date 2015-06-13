var $ = {
  tc: function (fn) {
    return function () {
      return fn.apply(this, Array.prototype.slice.call(arguments, 1));
    };
  },

  Detective: {
    room: 'test'
  }
}, stratctl = require('./lib/strategy-controller')($);

stratctl.getBest(function (result) {
  console.log('result => %s', JSON.stringify(result, null, 2));
  
  setTimeout(function () {
    console.log('best => %s', JSON.stringify(stratctl.best, null, 2));
  }, 1000);
});