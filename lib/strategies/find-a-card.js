/**
 * @file lib/strategies/find-a-card.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

module.exports = function (room) {
    var $global = this.$global,
        tops = $global.master.Guess.person.concat($global.master.Guess.room, $global.master.Guess.weapon),
        target,
        initProb = 0,
        ask = {};

    for (var guessI in tops) {
        if (tops[guessI].prob > initProb && tops[guessI].prob < 1) {
            // if we're not checking the room, OR, if we're checking the room AND either we haven't
            // been passed a room, OR the target room is the best room
            //console.log('index: '+ guessI);
            //console.log('defined room as: '+room)
            if  ((guessI !== 1) || (guessI === 1 && (!room || room === tops[1].itm)) && !~$global.Detective.seen.indexOf(tops[guessI].itm) ) {
                target = tops[guessI];
                initProb = tops[guessI].prob;
            };
        };
    };

    console.log('target card to find is: ' + target.itm);

    /* So this would be the simulation way... it could get kinda crazy though, so we'll just have fun with doing it basically for now
 
    var sim = {guess: $global.master.Guess, players: $global.players}
     for(var player of sim.players) {
       Object.observe(player.possible, function(changes){
         console.log('Change in '+ player.name);
       })
     };
     
     for (startI in sim.players){
       if(sim.players[startI].name === $global.Detective.name){break;}
     }
     startI = startI===sim.players.length-1 ? 0:startI+1;
     ... etc...
    */

    ask.weight = initProb;
    ask[$global.cardtype(target.itm)] = target.itm;

    //collect up all the cards that we know won't appear in an answer (detective.sure, and master where prob=1)
    var cardset = $global.Detective.sure.slice();
    
    if ($global.master.Guess.room.first().prob === 1) {
        cardset.push($global.master.Guess.room.first().itm)
    }
    if ($global.master.Guess.person.first().prob === 1) {
        cardset.push($global.master.Guess.person.first().itm)
    }
    if ($global.master.Guess.weapon.first().prob === 1) {
        cardset.push($global.master.Guess.weapon.first().itm)
    }


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
    ask[$global.cardtype(NC1)] = NC1;
    ask[$global.cardtype(NC2)] = NC2;

    // quick-fix for the room/place bug
    ask.place = room || ask.room;

    //if anything in ask is undefined, we can't use this strat, so return an error, and a weight of 0.
    if (!ask.person || !ask.place || !ask.weapon) {
        console.log('Not enough cards to compute!')

        ask.weight = -1; //make sure we're at the bottom
        ask.place = 'unknown';
        ask.person = 'unknown';
        ask.weapon = 'unknown';
    }

    //AAAND we're done
    this.done(null, ask);
};

// define name after logic, or
// the property will be assigned to the
// wrong object
module.exports.title = 'Find a Card';
