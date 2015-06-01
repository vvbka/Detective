/**
 * @file lib/strategy.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

// support event api
module.exports = require('fishbone')({
    /**
     * Superclass for all strategies.
     * @class Strategy
     **/
    init: function () {
        this.weight = 0
        this.destination = 'unknown'

        // we update ourselves when a new calculation
        // is made
        this.on('updated', function (data) {
            this.weight = data.weight
            this.destination = data.destination
        }.bind(this))
    },

    /**
     * @memberof Strategy
     * @method update
     * @params {String} room - the restrained destination (if not set, the best destination will be selected.)
     * @fires Strategy#updated
     */
    update: function (room) {
        this.destination = room || 'unknown'

        /**
         * Update event. Fired upon the completion of update.
         * @event Strategy#updated
         * @type {Object}
         * @property {number} weight - the maximum potential weight of the current strategy
         * @property {String} destination - the target room the strategy is aiming for
         **/

        // i.e.
        //  this.emit('updated', {
        //      weight: 0
        //    , destination: target
        //  })
    }
})
