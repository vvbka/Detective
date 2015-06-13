/**
 * @file lib/strategy.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
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
        this.place = room || 'unknown';
        this.done = function (err, result) {
            if (err) this.promise.reject(err);
            else { 
                // we update ourselves when a new calculation is made
                this.weight = result.weight;
                this.place = result.place;
                this.person = result.person;
                this.weapon = result.weapon;
            
                // resolve the promise
                promise.resolve(result);
            }
        }.bind(this);
    }
});