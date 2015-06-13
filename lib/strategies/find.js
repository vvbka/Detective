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
module.exports = {
    init: function () {
        this.name = 'Find a Card';
    },

    update: function () {
        this.emit('updated', {
            weight: Infinity,
            place: 'Neverland',
            person: 'Peter Pan',
            weapon: 'Wand',
            name: this.name
        })
    }
};