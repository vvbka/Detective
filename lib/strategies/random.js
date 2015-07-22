/**
 * lib/strategies/random.js - Detective
 * Another last resort that gets funky with randoms.
 * license GPLv2.
 * copyright 2015 VVBKA.
**/

"use strict";

var priority = require('../priority'),
    simprob = require('../simprob'),
    rndint = function (min, max) {
        return Math.round(min + ((max - min) * Math.random()));
    };

module.exports = function () {
    var delta = priority('prob'),
        Guess = this.$global.master.Guess,
        ques = {
            person: null,
            weapon: null,
            place: null
        };
    
    // select a random guess
    ques.person = Guess.person[rndint(0, Guess.person.length - 1)];
    ques.place = Guess.room[rndint(0, Guess.room.length - 1)];
    ques.weapon = Guess.weapon[rndint(0, Guess.weapon.length - 1)];
    
    // add place if restricted
    if (this.place) {
        ques.place = Guess.room.filter(function (card) {
            return card.itm === this.place;
        })[0];
    }
    
    if (!ques.place) {
        return this.done(null, {
            weight: -1,
            person: null,
            weapon: null,
            place: 'unknown'
        });
    }
    
    // simulate all possible deltas
    for (var thing in ques) {
        if (ques.hasOwnProperty(thing)) {
            delta.add({
                card: ques[thing].itm,
                prob: simprob.call(this.$global, {
                    itm: ques[thing].itm,
                    prob: ques[thing].prob
                })
            });
            
            ques[thing] = ques[thing].itm;
        }
    }
    
    // use best case scenario as weight
    console.log(delta);
    ques.weight = delta.first().prob;
    
    // ...
    this.done(null, ques);
};

module.exports.title = 'Random';