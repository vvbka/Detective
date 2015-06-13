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

    $scope.stratctl = null;
    $scope.activestrat = null;
    $scope.board = board.board;
    $scope.labels = board.labels;
    $scope.doors = board.doors;
    $scope.savable = true;

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
    window.$$$ = $scope;
    $global.myTurn = function () {
        $scope.stratctl.getBest(function (result) {
            if (result.place === Detective.room) {
                $global.alfred.say('Ask: Was it %s in the %s with a %s?', result.person, result.place, result.weapon);
            } else {
                // ...
            }
        });
    };

    // load strategy for editing
    $scope.loadStrat = function (strat) {
        fs.readFile(path.resolve(__dirname, '.', 'lib', 'strategies', strat + '.js'), 'utf8', $global.tc(function (data) {
            $scope.$apply(function () {
                $scope.activestrat = {
                    fname: strat,
                    name: $scope.stratctl.strategies[strat].name
                };

                $global.editor.setValue(data);
                $global.editor.gotoLine(1);
            });
        }));
    };

    // create new strategy
    $scope.newStrat = function () {
        $global.editor.setValue('module.exports = function (destination) {\n  \'use strict\';\n  \n  // TODO: ... write some logic ...\n};');
        $global.editor.gotoLine(1);
        $scope.activestrat = {
            fname: '',
            name: ''
        };
    };
   
    // saving code
    $scope.save = function () {
        var fname = $scope.activestrat.name.toLowerCase().replace(/\W+/g, '-');
        if (fname) {
            fs.writeFile(path.resolve(__dirname, '.', 'lib', 'strategies', fname + '.js'), $global.editor.getValue(), $global.tc(function () {
                $scope.$apply(function () {
                    console.log('saving: ' + fname);
                
                    $scope.strats.push(fname);
                    $scope.strats = $scope.strats.filter(function (elm, index, self) {
                        return self.indexOf(elm) === index;
                    });
                
                    console.log($scope.strats);
                });
            }));
        }
    };

    $global.editor.commands.addCommand({
        name: 'Save',
        bindKey: {
            win: 'Ctrl-S',
            mac: 'Command-S'
        },
        exec: function (editor) {
            $scope.save();
        }
    });

   //Update the game board with player locations
   $('#modal-board').on('show.bs.modal', function (ev) {
       var dL = $global.Detective.location, sel = '#board-'+dL[0]+'-'+dL[1];
       $(sel).addClass($global.Detective.charName.split(' ')[1]+'-bg');
       $(sel).html('<span class="glyphicon glyphicon-search"></span>');
       
       for(var pl of $global.players) {
           sel = '#board-'+pl.location[0]+'-'+pl.location[1];
           $(sel).addClass(pl.charName.split(' ')[1]+'-bg');
       }; 
   });
   
   //be a good samaritan and cleanup after the modal closes, things might be different next time
   $('#modal-board').on('hidden.bs.modal', function (ev) {
       var dL = $global.Detective.location, sel = '#board-'+dL[0]+'-'+dL[1];
       $(sel).removeClass($global.Detective.charName.split(' ')[1]+'-bg');
       $(sel).html('');
       
       for(var pl of $global.players) {
           sel = '#board-'+pl.location[0]+'-'+pl.location[1];
           $(sel).removeClass(pl.charName.split(' ')[1]+'-bg');
       }; 
   });

    // reset the entire controller
    $scope.reloadStrats = function () {
        $scope.stratctl = require('./lib/strategy-controller')($global);
        $('#modal-strats').modal('hide');
    };

    // load up the controller
    $scope.reloadStrats();
});
