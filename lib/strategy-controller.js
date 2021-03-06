/**
 * lib/strategy-controller.js - Detective
 * license GPLv2.
 * Copyright 2015 VVBKA.
**/

"use strict";

var fs = require('fs'),
    path = require('path'),
    q = require('q'),
    inherits = require('./inherits'),
    klass = require('./klass'),
    Strategy = require('./strategy'),
    StrategyController = klass({
        /**
         * A master controller for all strategies.
         * @class StrategyController
         **/
        init: function ($global) {
            this.$global = $global;
            this.strategies = {};
            this.nstrategies = 0;
            this.threshold = Infinity;
            this.best = {
                weight: -Infinity,
                place: null,
                person: null,
                weapon: null,
                name: null
            };

            // aliases
            Object.defineProperties(this, {
                weight: {
                    get: function () {
                        return this.best.weight;
                    }.bind(this)
                },

                place: {
                    get: function () {
                        return this.best.place;
                    }.bind(this)
                }
            })

            // import all strategies from local folder
            var list = fs.readdirSync(path.resolve(__dirname, 'strategies')),
                init = function (name) {
                    return function () {
                        this.name = name;
                    };
                },
                updater = function (fn) {
                    return function () {
                        // add the info of this call to
                        // the local scope
                        var ctx = this,
                            args = arguments;

                        // force update to be asynchronous
                        setTimeout(function () {
                            fn.apply(ctx, args);
                        }, 1);
                    };
                };

            this.nstrategies = list.length;
            for (var strat of list) {
                var strategy = require('./strategies/' + strat),
                    MyStrategy = inherits(klass({
                        init: init(strategy.title),
                        update: updater(strategy)
                    }), Strategy),
                    stratn = strat.substr(0, strat.length - 3);

                this.strategies[stratn] = new MyStrategy(this.$global);
            };
        },

        /**
         * @memberof StrategyController
         * @method update
         * @params {String} room - an optional destination lock-in.
         * @params {Number} threshold - the confidence threshold to use this time around.
         * @fires StrategyController#updated
         **/
        update: function (room, threshold) {
            var all = [];

            this.done = 0;
            this.threshold = threshold || this.threshold;
            this.best = {
                weight: -Infinity,
                place: null,
                person: null,
                weapon: null,
                name: null
            };

            for (var strategy in this.strategies) {
                if (this.strategies.hasOwnProperty(strategy)) {
                    all.push(this.strategies[strategy].update(room).promise);
                }
            }

            q.allSettled(all).then(function (results) {
                results = results.map(function (result) {
                    return result.value;
                });

                for (var result of results) {
                    if (result.weight > this.best.weight) {
                        this.best = {
                            weight: result.weight,
                            place: result.place,
                            person: result.person,
                            weapon: result.weapon,
                            name: result.name
                        };
                    }

                    if (this.best.weight >= this.threshold) {
                        console.log('%s broke the threshold.', this.best.name);
                        break;
                    }
                }

                console.log('%s was found to be the best.', this.best.name);
                console.log(this.best);

                this.emit('found', this.best);
            }.bind(this));
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
