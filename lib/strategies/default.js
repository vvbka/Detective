/**
 * lib/strategies/default.js - Detective
 * A last resort strategy that attempts to find out something about the cards lowest on the stacks
 * license GPLv2.
 * copyright 2015 VVBKA.
**/

"use strict";

module.exports = function (room) {

    this.done(null, {
        weight: 1e-100,
        person: this.$global.master.Guess.person.last().itm,
        weapon: this.$global.master.Guess.weapon.last().itm,
        place: room || this.$global.master.Guess.room.last().itm
    });

}

module.exports.title = 'Default';
