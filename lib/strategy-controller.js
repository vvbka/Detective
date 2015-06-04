/**
 * @file lib/strategy-controller.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

var StrategyController = require('./klass')({
    /**
     * A master controller for all strategies.
     * @class StrategyController
     **/
    init: function ($global, list) {
        var _done = 0

        this.$global = $global
        this.strategies = []
        this.threshold = Infinity
        this.best = {
            weight: -Infinity,
            destination: null,
            name: null
        }

        // aliases
        Object.defineProperties(this, {
            weight: {
                get: function () {
                    return this.best.weight
                }.bind(this)
            },

            destination: {
                get: function () {
                    return this.best.destination
                }.bind(this)
            },

            done: {
                get: function () {
                    return _done
                },

                set: function (value) {
                    _done = value | 0

                    /**
                     * Signals upon best result resolution.
                     * @event StrategyController#found
                     * @type {Object}
                     * @property {Number} weight - the best strategy's weight
                     * @property {String} destination - the destination room.
                     * @property {String} name - the name of the strategy.
                     **/
                    if (_done === this.strategies.length) {
                        this.emit('found', this.best)
                    } else if (this.best.weight >= this.threshold) {
                        this.emit('found', this.best)
                    }
                }.bind(this)
            }
        })

        // import all strategies from local folder
        for (var strat of list) {
            var MyStrategy = require('./strategies/' + strat),
                last = -1 + this.strategies.push(new MyStrategy(this.$global))

            this.strategies[last].on('updated', function (data) {
                console.log(data);

                if (data.weight > this.best.weight) {
                    this.best = data
                }

                this.done += 1
            }.bind(this))
        }
    },

    /**
     * @memberof StrategyController
     * @method update
     * @params {String} room - an optional destination lock-in.
     * @params {Number} threshold - the confidence threshold to use this time around.
     * @fires StrategyController#updated
     **/
    update: function (room, threshold) {
        this.done = 0
        this.threshold = threshold || this.threshold

        for (var strategy of this.strategies) {
            strategy.update(room)
        }
    }
});

module.exports = function ($global, list) {
  return new StrategyController($global, list);
};
