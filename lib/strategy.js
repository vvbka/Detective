/**
 * @file lib/strategy.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

// support event api
module.exports = require('./klass')({
    /**
     * Superclass for all strategies.
     * @class Strategy
     **/
    init: function ($global) {
        this.weight = 0
        this.person = this.place = this.weapon = 'unknown'
        this.$global = $global

        // we update ourselves when a new calculation
        // is made
        this.on('updated', function (data) {
            this.weight = data.weight
            this.place = data.place
            this.person = data.person
            this.weapon = data.weapon
        }.bind(this))
    },

    /**
     * @memberof Strategy
     * @method update
     * @params {String} room - the restrained destination (if not set, the best destination will be selected.)
     * @fires Strategy#updated
     */
    update: function (room) {
        this.place = room || 'unknown'

        /**
         * Update event. Fired upon the completion of update.
         * @event Strategy#updated
         * @type {Object}
         * @property {number} weight - the maximum potential weight of the current strategy
         * @property {String} place - the target room the strategy is aiming for
         **/

        // i.e.
        //  this.emit('updated', {
        //      weight: 0
        //    , place: target
        //  })
    }
})