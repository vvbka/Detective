/**
 * @file lib/strategies/test.js
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
        this.name = 'Test';
    },

    update: function () {
        this.done(null, {
            weight: 1,
            place: this.$global.Detective.room,
            person: 'Peter Pan',
            weapon: 'Wand',
            name: this.name
        })
    }
};