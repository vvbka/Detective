/**
 * lib/simprob.js - detective
 * Licensed under GPLv2.
 * Copyright (C) 2015 VVBKA.
 */

'use strict';

module.exports = function (card) {
	var Guess = this.master.Guess,
		masterprob = card.prob;

	// simulate probability
    for (var stack in Guess) {
        if (Guess.hasOwnProperty(stack)) {
            if (stack !== this.cardtype(card.itm)) {
                masterprob *= Guess[stack].first().prob;
            }
        }
    }
    
    return (Guess.person.first().prob * Guess.weapon.first().prob * Guess.room.first().prob) - masterprob;
};