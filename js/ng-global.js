/**
 * js/ng-global.js - detective
 * safely define globals without globalling them.
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

'use strict';

process.app.factory('$global', function () {
  return (window.$global = {
    master: {Guess:{}, Definite:[]},
    cardset: {
      people: ['Ms. Scarlet', 'Colonel Mustard', 'Professor Plum', 'Mr. Green', 'Mrs. White', 'Mrs. Peacock'],
      rooms: ['Ballroom', 'Billards Room', 'Conservatory', 'Dining Room', 'Hall', 'Kitchen', 'Lounge', 'Study'],
      weapons: ['Axe', 'Bomb', 'Candlestick', 'Knife', 'Pipe', 'Poison', 'Revolver', 'Rope', 'Syringe', 'Wrench']
    }
  });
});