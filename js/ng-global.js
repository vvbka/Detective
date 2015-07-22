/**
 * js/ng-global.js - Detective
 * Safely define globals without globalling them.
 * Licensed under GPLv2.
 * Copyright (C) 2015 VVBKA.
**/

'use strict';

process.app.factory('$global', function () {
    return (window.$global = {
        master: {
            Guess: {},
            Definite: {}
        },
        //update Cardset to reflect actual avaiable playing cards at outset (using 'not' command will have an impact on the probabilities)
        cardset: {
            people: ['Ms. Scarlet', 'Colonel Mustard', 'Professor Plum', 'Mr. Green', 'Mrs. White', 'Mrs. Peacock'],
            rooms: ['Ballroom', 'Billiard Room', 'Conservatory', 'Dining Room', 'Hall', 'Kitchen', 'Lounge', 'Study', 'Library'],
            weapons: ['Candlestick', 'Knife', 'Pipe', 'Revolver', 'Rope', 'Wrench'],
        },
        Detective: {},
        players: [],
        threshold: 0.9
    });
});
