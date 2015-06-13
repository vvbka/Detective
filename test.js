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
  console.log(require('util').inspect(result, {
    colors: true,
    depth: Infinity
  }));
});