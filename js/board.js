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
    $scope.entries = board.entries;
    $scope.savable = true;

    // is this an entry point
    $scope.isEntry = function (x, y) {
        //console.log('[%s,%s]',x,y);

        for (var room in $scope.entries) {
            if ($scope.entries.hasOwnProperty(room)) {
                for (var entry of $scope.entries[room]) {
                    if (entry[0] === x && entry[1] === y) {
                        //console.log('=> is entry');
                        return true;
                    }
                }
            }
        }

        return false;
    };

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

    // path handling
    $scope.path = [];
    $scope.evalPath = function (path, roll) {
        // show the board
        if (!$('#modal-board').is('.in')) {
            $('.modal.in').modal('hide');
            $('#modal-board').modal('show');
        }

        // fix the path (astar reverses x and y)
        $scope.path = path.map(function (vertex) {
            return [vertex.y, vertex.x];
        }).filter(function (elm, index) {
            // we are only capable of traversing
            // the first `roll` nodes of a path
            // since that is what the dice proclaimed
            return index < roll;
        });

        // take detective to the last vertex
        Detective.location = $scope.path[$scope.path.length - 1];

        // try and apply
        try {
            $scope.$apply()
        } catch (e) { /* ignore if angular is upset at double $apply */ }
    };

    // handle path undos
    $('#modal-board').on('hidden.bs.modal', function () {
        $scope.path = [];
        $scope.$apply($global.locationSet);
    });

    $global.locationSet = function () {
        $scope.detloc = Detective.location;
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
                    $global.alfred.output.say('Input command ...'); //reset Alfred
                    
                    var rooms = {},
                        room,
                        point,
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
                            return astar.search(
                                B,
                                B.grid[Detective.location[1]][Detective.location[0]],
                                B.grid[end[1]][end[0]]
                            );
                        },
                        rpath = [],
                        closest = [Infinity, 'none'];
                    //console.log(util.inspect(Bmap, {
                    //    colors: true
                    //}));

                    // get distance and path to result.place
                    for (point of $scope.entries[result.place]) {
                        var tmp = search(point);

                        // since all weights are 1 or 0, the weight
                        // of the path must be the length of the path
                        // plus the door itself
                        if (rpath.length === 0 || rpath.length > tmp.length) {
                            rpath = tmp;
                        }
                    }

                    // if we can reach that room on this turn, we
                    // should immediately aim for that
                    if (rpath.length <= roll) {
                        return $scope.evalPath(rpath, roll);
                    }

                    // calculate distance to every door
                    // of every room to calculate closest room
                    console.time('astar');
                    for (room in $scope.entries) {
                        if ($scope.entries.hasOwnProperty(room)) {
                            var min = [];
                            rooms[room] = [];

                            for (point of $scope.entries[room]) {
                                rooms[room].push(search(point));

                                // since all weights are 1 or 0, the weight
                                // of the path must be the length of the path
                                // plus the door itself
                                if (rooms[room][rooms[room].length - 1].length < min.length || min.length === 0) {
                                    door = $scope.doors[room][rooms[room].length - 1];
                                    min = rooms[room][rooms[room].length - 1];

                                    // add the respective door at the end of the
                                    // path
                                    min.push({
                                        visited: true,
                                        weight: 1,

                                        // swap x and y for consistency with
                                        // rest of the nodes
                                        x: door[1],
                                        y: door[0]
                                    });
                                }
                            }

                            // use the closest door for the room's weight
                            rooms[room] = min;

                            // calculate closest room as well
                            if (rooms[room].length < closest[0]) {
                                closest = [rooms[room].length, room];
                            }
                        }
                    }
                    console.timeEnd('astar');

                    // ...
                    console.log('%s is the closest room at a distance of %s steps.', closest[1], closest[0]);
                    console.log('%s (at a distance of %s steps) was recommended by best strategy.', result.place, rpath.length);

                    // if they're both the same, then just evaluate path
                    if (result.place === closest[1]) {
                        return $scope.evalPath(rooms[closest[1]], roll);
                    }

                    // re-calculate strategies for closest room
                    $scope.stratctl.getBest(closest[1], function (clResult) {
                        var best = rooms[closest[1]],
                            ratios = {
                                closest: clResult.weight / closest[0],
                                result: result.weight / rpath.length
                            };

                        // determine best path based on ratios
                        console.log(ratios);
                        if (ratios.result > ratios.closest) {
                            best = rpath;
                        }

                        // evaluate path
                        $scope.evalPath(best, roll);
                    });
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

    // misc helpers for dynamic board updating
    $scope.isDetHere = function (x, y) {
        return Detective.location && Detective.location[0] === x && Detective.location[1] === y;
    };

    $scope.isCDetHere = function (x, y) {
        return $scope.detloc && $scope.detloc[0] === x && $scope.detloc[1] === y;
    };

    $scope.loc2class = function (x, y) {
        for (var player of $global.players) {
            if (player.location[0] === x && player.location[1] === y) {
                return ' ' + player.charName.split(' ')[1] + '-bg';
            }

            if (player.detective && $scope.detloc[0] === x && $scope.detloc[1] === y) {
                return ' ' + player.charName.split(' ')[1] + '-bg';
            }
        }

        return '';
    };

    $scope.onPath = function (x, y) {
        for (var vertex of $scope.path) {
            if (vertex[0] === x && vertex[1] === y) return true;
        }

        return false;
    };

    $scope.stepn = function (x, y) {
        for (var i = 0; i < $scope.path.length; i += 1) {
            if ($scope.path[i][0] === x && $scope.path[i][1] === y) return i;
        }

        return -1;
    };

    //setup the path animation
    $('#modal-board').on('shown.bs.modal', function(){
        //console.log('shown')
        var steps = $('.path').length-1;
        for(var i=0;i<steps;i+=1){
            //console.log('added: '+i)            
            $('.path.step-'+i).css('transition-delay', (4+i)+'s').addClass('step-in');
        }
    });
    
    $('#modal-board').on('hidden.bs.modal', function(){
        $('.step-in').removeClass('step-in');
    });
    

    // reset the entire controller
    $scope.reloadStrats = function () {
        $scope.stratctl = require('./lib/strategy-controller')($global);
        $('#modal-strats').modal('hide');
    };

    // load up the controller
    $scope.reloadStrats();
});
