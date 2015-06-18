/**
 * js/board.js - detective
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('BoardController', function ($scope, $global) {
    'use strict';

    var fs = require('fs'),
        path = require('path'),
        util = require('util'),
        priority = require('./lib/priority'),
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
    $global.board = $scope.board = board.board;
    $scope.labels = board.labels;
    $scope.doors = board.doors;
    $scope.entries = board.entries;
    $scope.passages = board.passages;
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
    this.ask = function (question) {
        $global.alfred.input.get(util.format('Ask: "was it %s in the %s with a %s?" Who answered and what did they show you?', question.person, question.place, question.weapon), function (answer) {
            // create full card list
            question.cards = [question.person, question.room, question.weapon];

            //filter out the cards that are in our hand
            question.cards = question.cards.filter(function(crd) {
                return ($.inArray(crd, $global.Detective.sure)===-1);
            }).filter(function(n){return n;});

            // figure out who answered
            var answerer = $global.classifiers.players.classify(answer),
                cardtype;

            // figure out what they showed
            answer = $global.classifiers.cards.classify(answer);
            cardtype = $global.cardtype(answer);

            // remove all question cards from the possibles
            // of everyone between us and who showed
            outer: for (var i = 0; i < $global.players.length; i += 1) {
                if ($global.players[i].detective) {
                    for (i = (i + 1) === $global.players.length ? 0 : (i + 1);; i += 1) {
                        if ($global.players.length === i) i = 0;
                        if ($global.players[i].detective) break outer;

                        if ($global.players[i].name !== answerer) {
                            console.log('ELIMINATE FROM: %s', $global.players[i].name);
                            $global.players[i].possible = $global.players[i].possible.filter(function (card) {
                                return !~question.cards.indexOf(card);
                            });
                        }
                    }
                }
            }

            // remove the card from the possibles of every single
            // player other than the answerer
            for (var player of $global.players) {
                if (!player.detective && player.name !== question.answerer) {
                    player.possible = player.possible.filter(function (card) {
                        return card !== answer;
                    });
                }
            }

            //did nobody answer?
            console.log('In response to my question '+answerer+' answered.');
            if(answerer === 'nobody'){
                //if no one answered, then the remaining cards have to be 100%.
                //console.log("setting " +question.cards+' to 100%');
                
                for(var crd of question.cards){
                    console.log("setting "+ crd +' to 100%');
                    $global.master.Guess[$global.cardtype(crd)].update('itm', {prob:1,itm:crd})
                    
                    //also, everything else in that same type should be filtered from the master guess list
                    $global.master.Guess[$global.cardtype(crd)] = $global.master.Guess[$global.cardtype(crd)].filter(function (card) {
                    return card.itm === crd;
                });
                }
                
                
            } else {
                // remove the card from the master guess
                $global.master.Guess[cardtype] = $global.master.Guess[cardtype].filter(function (card) {
                    return card.itm !== answer;
                });
            
                for (var player of $global.players) {
                    // add the card to the answerer's sure
                    if (player.name === answerer) {
                        player.sure.push(answer);
                    } else if (!player.detective) {
                        // edit everyone's maybes
                        var maybe = priority(player.maybe.key, player.maybe.comp);
                    
                        for (var row of player.maybe) {
                            maybe.add(row.filter(function (card) {
                                return card !== answer;
                            }));
                        }
                    
                        player.maybe = maybe;
                    
                        // re-evaluate edited maybe queue
                        while (player.maybe.length > 0 && player.maybe.first().length === 1) {
                            var first = player.maybe.pop()[0];
                        
                            // add to sure
                            player.sure.push(first);
                        
                            // remove from master guess
                            $global.master.Guess[$global.cardtype(first)] = $global.master.Guess[$global.cardtype(first)].filter(function (card) {
                                return card.itm !== first;
                            });
                        }
                    }
                }
            }

            // okay, we're done
            $global.alfred.output.say('Input command ...');
        });
    };

    // path handling
    $scope.path = [];
    $scope.questionwaiting = false;
    $scope.evalPath = function (path, roll, question) {
        // show the board
        if (!$('#modal-board').is('.in')) {
            $('.modal.in').modal('hide');
            $('#modal-board').modal('show');
        }

        // fix the path (astar reverses x and y)
        var len = path.length;
        $scope.path = path.map(function (vertex) {
            return [vertex.y, vertex.x];
        }).filter(function (elm, index) {
            // we are only capable of traversing
            // the first `roll` nodes of a path
            // since that is what the dice proclaimed
            return index < roll;
        });

        // check if path ends at a player location
        var last = $scope.path[$scope.path.length - 1];
        if ($scope.loc2class(last[0], last[1])) {
            $scope.path = $scope.path.slice(0, $scope.path.length - 1);
        }

        // take detective to the last vertex
        Detective.location = $scope.path[$scope.path.length - 1];

        // see if we can ask a question
        if (question && $scope.path.length === len) {
            $scope.questionwaiting = true;
            this.ask(question);
        }

        // try and apply
        try {
            $scope.$apply()
        } catch (e) { /* ignore if angular is upset at double $apply */ }
    }.bind(this);

    // handle path undos
    $('#modal-board').on('hidden.bs.modal', function () {
        $scope.path = [];
        $scope.questionwaiting = false;
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
                    roll = sum(roll.split(/[^0-9]+/g).map(function (n) {
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
                        Bmap = $scope.board.slice().map(function (row, y) {
                            return row.slice().map(function (piece, x) {
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

                    // get distance and path to result.place
                    for (var i = 0; i < $scope.entries[result.place].length; i += 1) {
                        var tmp = search($scope.entries[result.place][i]);

                        // since all weights are 1 or 0, the weight
                        // of the path must be the length of the path
                        // plus the door itself
                        if (rpath.length === 0 || rpath.length > tmp.length) {
                            rpath = tmp;
                            rpath.push({
                                weight: 1,
                                visited: true,

                                // swap x and y for consistency with
                                // rest of the nodes
                                x: $scope.doors[result.place][i][1],
                                y: $scope.doors[result.place][i][0]
                            });
                        }
                    }

                    // if we can reach that room on this turn, we
                    // should immediately aim for that
                    if (rpath.length <= roll) {
                        return $scope.evalPath(rpath, roll, result);
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

                    // if secret passage, prefer it
                    if ($scope.passages.hasOwnProperty(closest[1])) {
                        var doors = $scope.doors[$scope.passages[closest[1]]],
                            min = [],
                            mstart = [];

                        for (var start of doors) {
                            for (var door of $scope.doors[result.place]) {
                                // get path after passage
                                var after = astar.search(
                                    B,
                                    B.grid[start[1]][start[0]],
                                    B.grid[door[1]][door[0]]
                                );

                                //console.log('from [%s] of %s', start.join(','), closest[1]);
                                //console.log('to [%s] of %s', door.join(','), result.place);
                                //console.log(after);

                                // use minimal path
                                if (min.length === 0 || min.length > after.length) {
                                    min = after;
                                    mstart = start;
                                }
                            }
                        }

                        // is this path worth it?
                        if (rpath.length > (closest[0] + 1 + min.length)) {
                            console.log('I AM GOING TO TAKE THE SECRET PASSAGE NOW.');

                            // if we are in the room, take the passage
                            console.log('compare "%s" with "%s"', Detective.room, closest[1].toLowerCase());
                            if (Detective.room === closest[1].toLowerCase()) return $scope.evalPath([{
                                visited: true,
                                weight: 1,
                                x: mstart[1],
                                y: mstart[0]
                            }], roll);

                            // if not, head towards the closest room
                            return $scope.evalPath(rooms[closest[1]], roll);
                        }
                    }

                    // re-calculate strategies for closest room
                    $scope.stratctl.getBest(closest[1], function (clResult) {
                        var best = rooms[closest[1]],
                            ques = clResult,
                            ratios = {
                                closest: clResult.weight / closest[0],
                                result: result.weight / rpath.length
                            };

                        // determine best path based on ratios
                        console.log(ratios);
                        if (ratios.result > ratios.closest) {
                            best = rpath;
                            ques = result;
                        }

                        // evaluate path
                        $scope.evalPath(best, roll, ques);
                    });
                });
            }
        }.bind(this));
    }.bind(this);

    //Hand;ting the movement of other players
    this.movePlayer = $global.movePlayer = function (player) {
        $scope.activeplayer = player;
        try {
            $scope.$apply()
        } catch (e) {}
        $('#modal-board').modal('show');
    }

    $global.activeplayer = $scope.activeplayer = null;
    $scope.getPosition = function (x, y) {
        if ($scope.activeplayer) {
            $global.players.getByName($scope.activeplayer).location = [x, y];
            //console.log($scope.activeplayer + ' location updated to: '+x + ' '+y);
            $scope.activeplayer = null;
            $('#modal-board').modal('hide');
        }
    }

    //a cancel button, if you didn't mean to
    $scope.getPositionCancel = function () {
        $scope.activeplayer = null;
        $('#modal-board').modal('hide');
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
    $('#modal-board').on('shown.bs.modal', function () {
        //console.log('shown')
        var steps = $('.path').length - 1;
        for (var i = 0; i < steps; i += 1) {
            //console.log('added: '+i)            
            $('.path.step-' + i).css('transition-delay', (4 + i) + 's').addClass('step-in');
        }
    });

    $('#modal-board').on('hidden.bs.modal', function () {
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
