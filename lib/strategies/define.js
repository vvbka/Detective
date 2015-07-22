/**
 * lib/strategies/define.js - Detective
 * license GPLv2.
 * copyright 2015 VVBKA.
**/

"use strict";
// a strategy that tried to sort out maybe's from  a player
module.exports = function (room) {
	var ask = {}, topP=0, card, topM;
	
	try {
		for(var player of $global.players){
			if(!player.detective){
				var tm = player.maybe.first() //.filter(function(n) {return n});
				for(crd of tm){
					var inM = $global.master.Guess[$global.cardtype(crd)].find(function(c){return c.itm===crd;});
					if(1 - inM.prob > topP){
						topP=inM.prob;
						card = inM.itm;
						topM = tm;
					}
				}
			}
		}
		
		ask.room = room || topM[1]; 
		ask.person = topM[0];
		ask.weapon = topM[2];
		ask.weight = 1-topP;
		
		for(var t in ask){
			if(ask[t]===undefined){
				var fills = $global.Detective.sure.filter(function(n){return $global.cardtype(n)===t});
				ask[t] = fills[Math.floor(Math.random()*fills.length)]
			}
		}
	} catch(e){
		ask.weight = -1;
		ask.room = 'unknown'
		ask.person = 'unknown'
		ask.weapon = 'unknown'
	};
	
	ask.place = ask.room;
    this.done(null, ask);

}

module.exports.title = 'Define';
