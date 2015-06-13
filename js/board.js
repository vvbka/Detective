/**
 * js/board.js - detective
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('BoardController', function ($scope, $global) {
    'use strict';

    var fs = require('fs'),
        path = require('path'),
        Detective = $global.Detective,
        board = require('./data/board.json');

    $scope.strats = ['find'];
    $scope.stratctl = null;
    $scope.activectl = null;
    $scope.board = board.board;
    $scope.labels = board.labels;
    $scope.doors = board.doors;
    $scope.stratCode = '';

    // add room resolution to Detective
    Object.defineProperty(Detective, 'room', {
        get: function () {
            var loc = Detective.location.join(',');

            for (var room in $scope.doors) {
                if ($scope.doors.hasOwnProperty(room)) {
                    for (var door of $scope.doors[room]) {
                        if (door.join(',') === loc) return room;
                    }
                }
            }

            return null;
        }
    });

    // alfred binding for turn handling
    $global.myTurn = function () {
        stratctl.getBest(function (result) {
            console.log('result = ' + JSON.stringify(result));
            console.log('Detective.room = ' + Detective.room);

            if (result.place === Detective.room) {
                // ...
            } else {
                // ...
            }
        });
    };

    // load strategy for editing
    $scope.loadStrat = function (strat) {
        fs.readFile(path.resolve(__dirname, '.', 'lib', 'strategies', strat + '.js'), 'utf8', $global.tc(function (data) {
            $scope.$apply(function () {
                $scope.activectl = strat;
                $scope.stratCode = data;
            });
        }));
    };

    // reset the entire controller
    $scope.reloadStrats = function () {
        $scope.stratctl = require('./lib/strategy-controller')($global, $scope.strats);
        $('#modal-strats').modal('hide');
    };

    // load up the controller
    $scope.reloadStrats();
});