/**
 * @file lib/klass.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

var inherits = require('./inherits'),
    EventEmitter = require('eventemitter2').EventEmitter2

/**
 * Creates a new class with given methods, chaining, and events.
 * @method Klass
 * @params {Object} map - a map of the prototype.
 * @returns {Class} Class - a newly created class.
 **/
module.exports = function (map) {
    if (typeof map !== 'object') {
        throw 'give me a proper class map';
    }

    // an empty constructor is defaulted to
    var Klass = map.init || function () {},
        wrap = function (fn) {
            return function () {
                var ret = fn.apply(this, arguments)
                return ret === undefined ? this : ret
            }
        }

    // do we need to start with a given prototype,
    // only real use case:
    //  `proto: []`
    if (map.hasOwnProperty('proto')) {
        Klass.prototype = map.proto
    }

    // inherit eventemitter2
    Klass = inherits(Klass, EventEmitter)

    // bind all with chaining
    for (var prop in map) {
        if (map.hasOwnProperty(prop) && prop !== 'init' && prop !== 'proto') {
            if (typeof map[prop] === 'function') {
                Klass.prototype[prop] = wrap(map[prop])
            } else {
                Klass.prototype[prop] = map[prop]
            }
        }
    }

    // expose
    return Klass
}