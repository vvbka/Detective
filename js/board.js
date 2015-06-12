/**
 * js/board.js - detective
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('BoardController', function ($scope, $global) {
    'use strict';

    var Detective = $global.Detective,
        board = require('./data/board.json'),
        stratctl = require('./lib/strategy-controller')($global, [
            'find'
        ]);

    $scope.board = board.board;
    $scope.labels = board.labels;
    $scope.doors = board.doors;

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

            if (result.destination === Detective.room) {
                // ...
            } else {
                // ...
            }
        });
    };
});