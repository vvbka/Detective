/**
 * @file lib/strategies/find.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

/**
 * A strategy we need to work on.
 * @class Find
 **/
module.exports = require('../inherits')(require('../klass')({
    update: function () {
        this.emit('updated', {
            weight: Infinity,
            destination: 'place',
            name: 'Find a Card'
        })
    }
}), require('../strategy'))