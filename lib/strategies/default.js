/**
 * @file lib/strategies/default.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";
//a last resort strategy that attempts to find out something about the cards loweston the stacks
module.exports = function(room){	
	var ask = {
		weight:0.1,
		person : this.$global.master.Guess.person.last().itm,
		weapon :this.$global.master.Guess.weapon.last().itm,
		place : room || this.$global.master.Guess.room.last().itm
	};
	
	
	this.done(null, ask)
}

module.exports.title = 'Default';