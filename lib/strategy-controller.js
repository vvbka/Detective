/**
 * @file lib/strategy-controller.js
 * @project detective
 * @license MIT.
 * @copyright 2015 VBKA.
 **/

"use strict";

var inherits = require('./inherits'),
    klass = require('./klass'),
    Strategy = require('./strategy'),
    StrategyController = klass({
        /**
         * A master controller for all strategies.
         * @class StrategyController
         **/
        init: function ($global, list) {
            var _done = 0

            this.$global = $global
            this.strategies = {}
            this.nstrategies = list.length
            this.threshold = Infinity
            this.best = {
                weight: -Infinity,
                place: null,
                person: null,
                weapon: null,
                name: null
            }

            // aliases
            Object.defineProperties(this, {
                weight: {
                    get: function () {
                        return this.best.weight
                    }.bind(this)
                },

                place: {
                    get: function () {
                        return this.best.place
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
                        if (_done === this.nstrategies) {
                            this.emit('found', this.best)
                        } else if (this.best.weight >= this.threshold) {
                            this.emit('found', this.best)
                        }
                    }.bind(this)
                }
            })

            // import all strategies from local folder
            for (var strat of list) {
                var MyStrategy = inherits(klass(require('./strategies/' + strat)), Strategy)

                this.strategies[strat] = new MyStrategy(this.$global);
                this.strategies[strat].on('updated', function (data) {
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

            for (var strategy in this.strategies) {
                if (this.strategies.hasOwnProperty(strategy)) {
                    this.strategies[strategy].update(room)
                }
            }
        },

        /**
         * @memberof StrategyController
         * @method getBest
         * @params {String} room - an optional destination to lock onto.
         * @params {Function} callback - function to call when best is found
         **/
        getBest: function (room, fn) {
            fn = (typeof room === 'string' ? fn : room) || function () {};
            room = typeof room === 'string' ? room : undefined;

            this.once('found', fn);
            this.update(room);
        }
    });

module.exports = function ($global, list) {
    return new StrategyController($global, list);
};