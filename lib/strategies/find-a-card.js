/**
 * @file lib/strategies/find-a-card.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

module.exports = function () {
  this.done(null, {
    weight: 1,
    place: this.place || 'kitchen',
    person: 'Peter Pan',
    weapon: 'Wand'
  });
};

// define name after logic, or
// the property will be assigned to the
// wrong object
module.exports.title = 'Find a Card';