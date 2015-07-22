/**
 * lib/strategy.js - Detective
 * license GPLv2.
 * copyright 2015 VVBKA.
 **/

"use strict";

var q = require('q');

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
    },

    /**
     * @memberof Strategy
     * @method update
     * @params {String} room - the restrained destination (if not set, the best destination will be selected.)
     * @fires Strategy#updated
     */
    update: function (room) {
        var promise = q.defer();

        this.promise = promise.promise;
        this.place = room || null;
        this.done = function (err, result) {
            if (err) promise.reject(err);
            else {
                // lower case the place
                result.place = result.place.toLowerCase();

                // we update ourselves when a new calculation is made
                this.weight = result.weight;
                this.place = result.place;
                this.person = result.person;
                this.weapon = result.weapon;
                result.name = this.name;

                // resolve the promise
                console.log(result);
                promise.resolve(result);
            }
        }.bind(this);
    }
});
