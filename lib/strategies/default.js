/**
 * @file lib/strategies/default.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";
// a last resort strategy that attempts to find out something about the cards lowest on the stacks
module.exports = function(room){	

	this.done(null, {
		weight: 1e-100,
		person : this.$global.master.Guess.person.last().itm,
		weapon : this.$global.master.Guess.weapon.last().itm,
		place :  room || this.$global.master.Guess.room.last().itm
	});

}

module.exports.title = 'Default';