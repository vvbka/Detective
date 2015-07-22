/**
 * lib/inherits.js - Detective
 * Licensed under GPLv2.
 * Copyright (C) 2015 VVBKA.
**/

"use strict";

module.exports = function (subClass, superClass) {
    var inherited = function () {
            superClass.apply(this, arguments)
            subClass.apply(this, arguments)
        },
        wrap = function (method) {
            return function () {
                var superRet = superClass.prototype[method].apply(this, arguments)
                return subClass.prototype[method].apply(this, arguments) || superRet
            }
        }

    for (var i in superClass.prototype) {
        if (superClass.prototype.hasOwnProperty(i)) {
            if (typeof superClass.prototype[i] === 'function' && typeof subClass.prototype[i] === 'function') {
                inherited.prototype[i] = wrap(i)
            } else {
                inherited.prototype[i] = superClass.prototype[i]
            }
        }
    }

    for (var i in subClass.prototype) {
        if (subClass.prototype.hasOwnProperty(i) && !inherited.prototype.hasOwnProperty(i)) {
            inherited.prototype[i] = subClass.prototype[i];
        }
    }

    return inherited
}
