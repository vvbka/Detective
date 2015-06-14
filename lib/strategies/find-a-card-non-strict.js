/**
 * @file lib/strategies/find-a-card-non-strict.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

var priority = require('../priority');

module.exports = function () {
  var Guess = this.$global.master.Guess,
      guess = Guess.room.concat(Guess.weapon).concat(Guess.person),
      best = guess.pop(),
      queue = priority(guess.key, guess.comp),
      question = {
        person: null,
        place: null,
        weapon: null
      };
  
  // if best is room but we have been restricted to a different
  // room, then we need to select the next best
  best.type = this.$global.cardtype(best.itm);
  if (this.place) {
    // we need a non-room at this point
    while (best.type === 'room') {
      best = guess.pop();
      best.type = this.$global.cardtype(best.itm);
    }
    
    // add to the question
    question.place = this.place;
    console.log('restricting location to: %s', question.place);
  }
  
  // add the target card to the question
  question[best.type] = best.itm;
  console.log('target card: %s', best.itm);

  // creating a queue to determine the cards
  // of best known location
  for (var stack in Guess) {
    if (Guess.hasOwnProperty(stack)) {
      var elm = (1 - Guess[stack].first().prob) > Guess[stack].last().prob
          ? {
              prob: 1 - Guess[stack].first().prob,
              itm: Guess[stack].first().itm
            } : Guess[stack].last();

      elm.type = stack === 'room' ? 'place' : stack;
      queue.add(elm);
    }
  }
  
  // create question
  while (queue.length > 0) {
    var first = queue.pop();
    if (!question[first.type]) {
      question[first.type] = first.itm;
    }
  }
  
  // clone the target stack without the target
  var clone = Guess[best.type].filter(function (card) {
    return card.itm !== best.itm;
  });
  
  // calculate new master probability
  var masterprob = clone.first().prob;
  for (var stack in Guess) {
    if (Guess.hasOwnProperty(stack) && stack !== best.type) {
      masterprob *= Guess[stack].first().prob;
    }
  }
  
  // add weight to result
  question.weight = (Guess.person.first().prob * Guess.weapon.first().prob * Guess.room.first().prob) - masterprob;
  
  // return result
  this.done(null, question);
};

// define name after logic, or
// the property will be assigned to the
// wrong object
module.exports.title = 'Find a Card (non-strict)';