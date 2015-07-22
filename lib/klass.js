/**
 * lib/klass.js - detective
 * Licensed under GPLv2.
 * Copyright (C) 2015 VVBKA.
**/

var EventEmitter = require('eventemitter2').EventEmitter2,
    inherits = require('./inherits');

module.exports = function (map) {
    var Klass = map.init || function () {},
        wrap = function (fn) {
            return function () {
                return map[fn].apply(this, arguments) || this;
            };
        },
        key;

    for (key in map) {
        if (map.hasOwnProperty(key)) {
            if (typeof map[key] === 'function') {
                Klass.prototype[key] = wrap(key);
            } else {
                Klass.prototype[key] = map[key];
            }
        }
    }

    return inherits(Klass, EventEmitter);
};
