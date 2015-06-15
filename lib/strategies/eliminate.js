/**
 * @file lib/strategies/eliminate.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

'use strict';

var priority = require('../priority');

module.exports = function () {
    var Guess = this.$global.master.Guess,
        guess = Guess.room.concat(Guess.weapon).concat(Guess.person),
        pairs = priority('diff', function (a, b) {
            return (a - b) < 0;
        });

    // create a list of pairs
    for (var i = 0; i < (guess.length - 1); i += 1) {
        pairs.add({
            one: guess[i],
            two: guess[i + 1],
            diff: guess[i].prob - guess[i + 1].prob
        });
    }

    // ...
    console.log(pairs);
    this.done(null, {
        weight: -1,
        person: null,
        place: this.place || this.$global.Detective.room || 'study',
        weapon: null
    });
};
