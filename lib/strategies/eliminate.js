/**
 * lib/strategies/eliminate.js - Detective
 * license GPLv2.
 * copyright 2015 VVBKA.
**/
'use strict';

var priority = require('../priority'),
    simprob = require('../simprob');

module.exports = function () {
    var Guess = this.$global.master.Guess,
        guess = Guess.room.concat(Guess.weapon).concat(Guess.person),
        pairs = priority('diff', function (a, b) {
            return (a - b) < 0;
        }),
        ques = {
            weight: -1,
            person: null,
            place: this.place,
            weapon: null
        },
        $global = this.$global,
        target,
        targettype;

    // create a list of pairs
    for (var i = 0; i < (guess.length - 1); i += 1) {
        pairs.add({
            card: guess[i].prob > guess[i + 1].prob ? guess[i] : guess[i + 1],
            diff: guess[i].prob - guess[i + 1].prob
        });
    }
    
    // set top item as target
    target = pairs.pop().card;
    targettype = $global.cardtype(target.itm);
    
    // simulate probability
    var cardset = $global.Detective.sure.slice();
    for (var stack in Guess) {
        if (Guess.hasOwnProperty(stack) && Guess[stack].first().prob === 1) {
            cardset.push(Guess[stack].first().itm);
        }
    }
    
    // add to the question
    ques[targettype] = ques[targettype] || target.itm;
    ques.weight = simprob.call(this.$global, target);

    // refactored from find-a-card.js
    // get all of Detectives cards which arn't af the same type as our target
    var NCARR1 = cardset.filter(function (crd) {
            return $global.cardtype(crd) !== $global.cardtype(target.itm);
        }),

        // pick a random card from that set
        NC1 = NCARR1[Math.floor(Math.random() * NCARR1.length)],

        // filter again for card's of the last type
        NCARR2 = NCARR1.filter(function (crd) {
            return $global.cardtype(crd) !== $global.cardtype(NC1);
        }),

        // pick a random card from that set
        NC2 = NCARR2[Math.floor(Math.random() * NCARR2.length)];

    // pop those into our question
    ques[$global.cardtype(NC1)] = NC1;
    ques[$global.cardtype(NC2)] = NC2;
    
    // quick-fix for the room/place bug
    ques.place = this.place || ques.room;

    //if anything in ask is undefined, we can't use this strat, so return an error, and a weight of 0.
    if (!ques.person || !ques.place || !ques.weapon) {
        console.log('Not enough cards to compute!')

        ques.weight = -1; // make sure we're at the bottom
        ques.place = 'unknown';
        ques.person = 'unknown';
        ques.weapon = 'unknown';
    }

    // ...
    this.done(null, ques);
};

// export a name
module.exports.title = 'Eliminate';