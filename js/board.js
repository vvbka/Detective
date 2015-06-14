/**
 * js/board.js - detective
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('BoardController', function ($scope, $global) {
    'use strict';

    var fs = require('fs'),
        path = require('path'),
        util = require('util'),
        Detective = $global.Detective,
        board = require('./data/board.json'),
        astarmod = require('javascript-astar'),
        astar = astarmod.astar,
        Graph = astarmod.Graph,
        sum = function (arr) {
            var nsum = 0;
            for (var n of arr) nsum += n;
            return nsum;
        };

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

    // question handling
    this.ask = function (ques) {
        $global.alfred.input.get(util.format('Ask: "was it %s in the %s with a %s?" Who answered?', ques.person, ques.place, ques.weapon), function (answerer) {
            $global.handleTurn($.extend({
                askerer: Detective.name,
                answerer: $global.classifiers.players.classify(answerer)
            }, ques));
        });
    };

    // alfred binding for turn handling
    window.$$$ = $scope;
    this.turn = $global.myTurn = function () {
        $scope.stratctl.getBest(function (result) {
            if (result.place === Detective.room) {
                this.ask(result);
            } else {
                $global.alfred.input.get('It\'s time to move. Roll the dice, and tell me what you get.', function (roll) {
                    // assume every numeric value given in the answer
                    // is to be summed up; that'll allow us to dynamically
                    // use any number of dice in the game
                    roll = sum(roll.split(/\s+/g).map(function (n) {
                        return parseInt(n, 10);
                    }).filter(function (n) {
                        return !isNaN(n);
                    }));
                    
                    console.log('roll calculated to be %s', roll);
                    
                    // calculate closest room
                    var rooms = {},
                        room,
                        door,
                        Bmap = $scope.board.slice().map(function (row) {
                          return row.slice().map(function (piece) {
                            // everything that is greater than one,
                            // we do not want astar to try and traverse
                            // so we give it an infinite weight to avoid
                            // involving it in astar's search
                            return piece === 2 ? 1 : (piece > 1 ? 0 : piece);
                          });
                        }),
                        B = new Graph(Bmap),
                        search = function (end) {
                            console.log('computing astar from (%s,%s) to (%s,%s)', Detective.location[0], Detective.location[1], end[0], end[1]);
                            var value = astar.search(
                                B,
                                B.grid[Detective.location[0]][Detective.location[1]],
                                B.grid[end[0]][end[1]]
                            );
                            console.log('path weight: %s', util.inspect(value, {
                                colors: true
                            }));
                            return value;
                        };
                    
                    console.log(util.inspect(Bmap, {
                        colors: true
                    }));
                    
                    // calculate distance to every door
                    // of every room
                    for (room in $scope.doors) {
                        if ($scope.doors.hasOwnProperty(room)) {
                            rooms[room] = [];
                            for (door of $scope.doors[room]) {
                                rooms[room].push(search(door));
                            }
                            
                            // use the closest door for the room's
                            // weight
                            rooms[room] = Math.min.apply(Math, rooms[room]);
                        }
                    }
                    
                    // ...
                    console.log(rooms);
                });
            }
        }.bind(this));
    }.bind(this);

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
