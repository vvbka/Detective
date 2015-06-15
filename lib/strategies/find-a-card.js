/**
 * @file lib/strategies/find-a-card.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

module.exports = function (room) {
    var $global = this.$global,
        tops = [$global.master.Guess.person.first(), $global.master.Guess.room.first(), $global.master.Guess.weapon.first()],
        target,
        initProb = 0,
        ask = {};
        
    for (var guessI of tops) {
        if (guessI.prob > initProb && guessI.prob < 1) {
            // if we're not checking the room, OR, if we're checking the room AND either we haven't
            // been passed a room, OR the target room is the best room
            if ((guessI !== 1) || (guessI === 1 && (!room || room === tops[1].itm))) {
                target = guessI;
                initProb = guessI.prob;
            }
        }
    }

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
    */

    ask.weight = initProb;
    ask[$global.cardtype(target.itm)] = target.itm;

    // get all of Detectives cards which arn't af the same type as our target
    var NCARR1 = $global.Detective.sure.filter(function (crd) {
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
    ask.place = ask.room;

    //AAAND we're done
    this.done(null, ask);
};

// define name after logic, or
// the property will be assigned to the
// wrong object
module.exports.title = 'Find a Card';
