/**
 * @file lib/strategies/find-a-card.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

module.exports = function (room) {
  var tops = [$global.master.Guess.person.first(), $global.master.Guess.room.first(), $global.master.Guess.weapon.first()], target, initProb=0, startI;
  for(var guessI in tops) {
    if(tops[guessI].prob > initProb  && tops[guessI].prob < 1){
      if( (guessI !== 1) || (guessI===1 && (room === 'undefined' || room===tops[1].itm) ) ){ //if we're not checking the room, OR, if we're checking the room AND either we haven't been passed a room, OR the target room is the best room
        target = tops[guessI];
        initProb = tops[guessI].prob;
      } 
    }
  }
  
  console.log('target card to find is: '+target.itm)
  
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
  
  var ask={weight:1-initProb}
  ask[$global.cardtype(target.itm)] = target.itm;
  
  //get all of Detectives cards which arn't af the same type as our target
  var NCARR1 = $global.Detective.sure.filter(function(crd){
      return $global.cardtype(crd) !==  $global.cardtype(target.itm);
  });
  var NC1 = NCARR1[ math.floor(Math.random()*NCARR1.length-1)] //pick a random card from that set
  
  //filter again for card's of the last type
  var NCARR2 = NCARR1.filter(function(crd){
    return $global.cardtype(crd) !== $global.cardtype(NC1);
  });
  var NC2 = NCARR2[ math.floor(Math.random()*NCARR2.length-1)] //pick a random card from that set
  
  //pop those into our question
  ask[$global.cardtype(NC1)] = NC1;
  ask[$global.cardtype(NC2)] = NC2;
  
  
  //AAAND we're done
  this.done(null, ask);
};

// define name after logic, or
// the property will be assigned to the
// wrong object
module.exports.title = 'Find a Card';