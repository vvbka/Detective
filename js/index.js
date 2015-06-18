/**
 * js/main.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('main', function ($scope, $global) {
    'use strict';

    window.$scope = $scope;

    // for errors
    $scope.error = {};
    $global.tc = require('trashcan');
    //     $global.tc.on('error', function (error) {
    //         console.log(error);
    //         $scope.$apply(function () {
    //             $scope.error = {
    //                 title: String(error),
    //                 stack: String(error.stack || 'No available stacktrace.')
    //             };
    // 
    //             $('#modal-err').modal('show');
    //         });
    //     });

    // for the ACE editor
    $global.editor = ace.edit("editor");
    $global.editor.setTheme("ace/theme/monokai");
    $global.editor.getSession().setMode("ace/mode/javascript");

    var os = require('os'),
        priority = require('./lib/priority'),
        nextPort = require('next-port'),
        BayesClassifier = require('natural').BayesClassifier,
        array = Array.prototype.slice.call.bind(Array.prototype.slice),
        handlers = {};

    $scope.aliases = {};
    $global.classifiers = {
        players: new BayesClassifier()
    };

    $scope.trainClassifiers = function () {
        // load classifiers
        $global.classifiers.people = new BayesClassifier();
        $global.classifiers.rooms = new BayesClassifier();
        $global.classifiers.weapons = new BayesClassifier();
        $global.classifiers.cards = new BayesClassifier();

        // add cardset
        for (var person of $global.cardset.people) {
            $global.classifiers.people.addDocument(person, person);
            $global.classifiers.cards.addDocument(person, person);
        }
        for (var room of $global.cardset.rooms) {
            $global.classifiers.rooms.addDocument(room, room);
            $global.classifiers.cards.addDocument(room, room);
        }
        for (var weapon of $global.cardset.weapons) {
            $global.classifiers.weapons.addDocument(weapon, weapon);
            $global.classifiers.cards.addDocument(weapon, weapon);
        }

        // add aliases
        for (var alias in $scope.aliases) {
            if ($scope.aliases.hasOwnProperty(alias)) {
                var ctype = $global.cardtype($scope.aliases[alias]);
                ctype = ctype === 'person' ? 'people' : (ctype + 's');

                $global.classifiers[ctype].addDocument(alias, $scope.aliases[alias]);
                $global.classifiers.cards.addDocument(alias, $scope.aliases[alias]);
            }
        }

        for (var ctype in $global.classifiers) {
            if ($global.classifiers.hasOwnProperty(ctype)) {
                setTimeout($global.classifiers[ctype].train.bind($global.classifiers[ctype]), 1);
            }
        }
    };

    // train initially
    $scope.trainClassifiers();

    // alfred commands
    $scope.alcmds = [{
        prompts: ['help'],
        desc: 'Show this help message.',
        fn: function* () {
            $('#modal-help').modal('show');
        }
    }, {
        prompts: ['set port *'],
        desc: 'Set the client port number.',
        fn: function* (input) {
            input = input.split(/[^0-9]+/g).map(function (word) {
                return parseInt(word, 10);
            }).filter(function (num) {
                return !isNaN(num);
            })[0];

            $scope.port = input;
            try {
                $scope.$apply();
            } catch (e) { /* ignore angular's spazzes */ }
        }
    }, {
        prompts: ['get my ip'],
        desc: 'Fetch your local IP address.',
        fn: function* () {
            var ifaces = os.networkInterfaces(),
                ip = '127.0.0.1';

            Object.keys(ifaces).forEach(function (ifname) {
                var alias = 0;

                for (var iface of ifaces[ifname]) {
                    if ('IPv4' !== iface.family || iface.internal !== false) {
                        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                        return;
                    }

                    //
                    ip = iface.address;
                    break;
                }
            });

            $global.alfred.output.say('Your IP address is: %s', ip);
            setTimeout(function () {
                $global.alfred.output.say('Input command ...');
            }, 3000);
        }
    }, {
        prompts: ['toggle possibles'],
        desc: 'Toggle the visibility of the possibles array.',
        fn: function* () {
            $scope.possiblesVisible = !$scope.possiblesVisible;

            try {
                $scope.$apply();
            } catch (e) { /* ignore potential angular spazzes */ }
        }
    }, {
        prompts: ['modal dismiss'],
        desc: 'Dismiss all active modals.',
        fn: function* () {
            $('.modal.in').modal('hide');
        }
    }, {
        prompts: ['show game board'],
        desc: 'Open up the game board.',
        fn: function* () {
            $('#modal-board').modal('show');
        }
    }, {
        prompts: ['* asked a question about * in the * with a *'],
        desc: 'Inform Detective that a question was asked.',
        fn: function* (input) {
            var question = {
                // Step #1: Use NaiveBayes Classifier to parse
                // the question.
                asker: $global.classifiers.players.classify(input),
                answerer: $global.classifiers.players.classify(
                    yield 'Who answered?'),
                person: $global.classifiers.people.classify(input),
                room: $global.classifiers.rooms.classify(input),
                weapon: $global.classifiers.weapons.classify(input)
            }

            // create full card list
            question.cards = [question.person, question.room, question.weapon];

            //Interject if we have to provide an answer
            if (question.answerer === $global.Detective.name) {
                console.log('Detective Answers!')
                    //get the subset of cards which are in our hand, and in the question
                var pos = question.cards.filter(function (q) {
                    return ($.inArray(q, $global.Detective.sure) != -1)
                });
                console.log(pos)

                if (pos.length > 0) { //check that we do actually have such a card
                    //get any cards we may have previously shown this player
                    var askr = $global.players.getByName(question.asker);
                    var shown = askr.shown.filter(function (sc) {
                        return ($.inArray(sc, pos) != -1);
                    });
                    console.log("we have shown: " + shown);

                    if (shown.length > 0) pos = shown;

                    var ret = pos[Math.floor(Math.random() * (pos.length - 1))]
                    console.log('Show Card %s', ret);

                    askr.shown.push(ret);

                    //return a card back to the Alfred window
                    $global.alfred.output.say('Show Card: ' + ret);
                    $scope.$apply();
                    setTimeout(function () {
                        $global.handleTurn(question);
                        //$global.alfred.output.say('Input Command...');
                        //$scope.$apply();
                    }, 3000)
                    return ret;

                } else {
                    console.log('Detective Can\'t Answer!')
                    question.answerer = $global.classifiers.players.classify(yield 'I\'m Sorry, I can\'t Answer.  Who was able to?')
                    $global.handleTurn(question);
                }
            }
            

        }
    }, {
        prompts: ['it is my turn', 'it\'s my turn', 'gimme a question to ask', 'handle my turn', 'my turn'],
        desc: 'Tell Detective that it is now your turn.',
        fn: function* () {
            if (($global.master.Guess.person.first().prob * $global.master.Guess.room.first().prob * $global.master.Guess.weapon.first().prob) > $global.threshold) {
                var ans = 'It was ' + $global.master.Guess.person.first().itm + ' in the ' + $global.master.Guess.room.first().itm + ' with a ' + $global.master.Guess.weapon.first().itm + '?',
                    resp = yield(ans);
                if (~resp.toLowerCase().indexOf('n')) {
                    window.alert("You LOST!!! :(");
                } else {
                    window.alert('You Won!!! YAY!!')
                }
            } else {
                $global.myTurn();
            }
        }
    }, {
        prompts: ['* moved', '* wants to move'],
        desc: 'Trigger the movement of a player',
        fn: function* (input) {
            var player = $global.classifiers.players.classify(input),
                cname = $global.players.getByName(player).charName;

            $global.movePlayer(player);

            if (handlers[cname]) {
                handlers[cname].emit('move');
            }
        }
    }, {
        prompts: ['set threshold *'],
        desc: 'Adjust the minimal certainty threshold.',
        fn: function* (input) {
            var newThresh = input.split(/\s+/g).map(function (n) {
                return parseFloat(n);
            }).filter(function (n) {
                return !isNaN(n);
            });
            $global.threshold = newThresh;
            console.log('set threshold to be ' + $global.threshold)
        }
    }, {
        prompts: ['not *'],
        desc: 'Exempt a card from the cardset (that you do not wish to play with).',
        fn: function* (input) {
            var card = $global.classifiers.cards.classify(input),
                ctype = $global.cardtype(card),
                cardset = ctype === 'person' ? 'people' : (ctype + 's');

            // remove from master
            $global.master.Guess[ctype] = $global.master.Guess[ctype].filter(function (crd) {
                return crd.itm !== card;
            });

            // remove from players
            for (var p of $global.players) {
                if (!p.detective) {
                    console.log('removng from: %s', p.name);
                    p.possible = p.possible.filter(function (crd) {
                        return crd !== card;
                    });
                }
            }

            // remove from cardset
            $global.cardset[cardset] = $global.cardset[cardset].filter(function (crd) {
                return crd !== card;
            });

            // re-train classifiers
            $scope.trainClassifiers();

            try {
                $scope.$apply();
            } catch (e) {};
        }
    }, {
        prompts: ['alias * as *'],
        desc: 'Alias a certain card as another. (alias ballroom as bedroom)',
        fn: function* (input) {
            input = input.toLowerCase().replace('alias', '');

            var card = $global.classifiers.cards.classify(input),
                ctype = $global.cardtype(card),
                newName = input.substr(input.indexOf('as') + 3).trim().split(/\s+/).map(function (word) {
                    word = word.replace(/\W+/, '');
                    return word[0].toUpperCase() + word.substr(1).toLowerCase();
                }).filter(function (word) {
                    return word;
                }).join(' ');

            // confirm
            if ((yield('Are you sure you want to alias "' + card + '" with "' + newName + '"?'))[0].toLowerCase() === 'y') {
                if (ctype === 'person') ctype = 'people';
                else ctype += 's';

                $scope.aliases[newName] = card;
                $scope.trainClassifiers();
            }

            $global.alfred.output.say('Input command ...');
        }
    }];

    // make alfred globally available
    $global.alfred = require('alfred');
    $global.alfred.init($scope.alcmds);

    $global.handleTurn = function (question) {
        console.log(question);

        var answerer = -1,
            asker,
            i;

        // create full card list
        question.cards = [question.person, question.room, question.weapon];

        try {
            // Step #2: Remove all three cards from possibles of all people between
            // who asked and who answered.
            //1. get the index of the asker
            for (i = 0; i < $global.players.length; i += 1) {
                if ($global.players[i].name === question.asker) {
                    asker = i;
                    console.log("asker %s found at %d", $global.players[i].name, asker);
                }
                //get the index of the answerer
                if ($global.players[i].name === question.answerer) {
                    answerer = i;
                    console.log('found answerer ' + $global.players[answerer].name + ' at ' + answerer);
                }
            }

            if (answerer === -1) {
                for (var player of $global.players) {
                    if (!player.detective && player.name !== question.asker) {
                        console.log('ELIMINATE FROM: ' + player.name);
                        player.possible = player.possible.filter(function (card) {
                            return !~question.cards.indexOf(card);
                        });
                    }
                }
            } else {
                for (i = asker + 1; i < $global.players.length; i += 1) {
                    if (i === answerer) break;

                    if (!$global.players[i].detective) {
                        console.log('ELIMINATE FROM: ' + $global.players[i].name);
                        $global.players[i].possible = $global.players[i].possible.filter(function (item) {
                            return !~question.cards.indexOf(item);
                        });
                    }

                    if (i === $global.players.length - 1) i = -1;
                }
            }

            // Step #3: Eliminate cards from the question which are NOT present
            // in the master guess.
            question.person = $global.master.Guess.person.filter(function (prsn) {
                return prsn.itm === question.person;
            }).length > 0 ? question.person : null;

            question.room = $global.master.Guess.room.filter(function (rm) {
                return rm.itm === question.room;
            }).length > 0 ? question.room : null;

            question.weapon = $global.master.Guess.weapon.filter(function (wpn) {
                return wpn.itm === question.weapon;
            }).length > 0 ? question.weapon : null;

            // add the question cards to the asker
            if (!$global.players[asker].detective && answerer !== -1) {
                $global.players[asker].maybe.add(question.cards.filter(function (card) {
                    return $global.players[asker].possible.indexOf(card) !== -1;
                }));
            }

            // Step #4: Eliminate cards remaining in the question which are NOT
            // in the Answerer's possibles.
            if (answerer !== -1 && !$global.players[answerer].detective) {
                question.person = $global.players[answerer].possible.filter(function (prsn) {
                    return prsn === question.person;
                }).length > 0 ? question.person : null;

                question.room = $global.players[answerer].possible.filter(function (rm) {
                    return rm === question.room;
                }).length > 0 ? question.room : null;

                question.weapon = $global.players[answerer].possible.filter(function (wpn) {
                    return wpn === question.weapon;
                }).length > 0 ? question.weapon : null;
            }

            // create clean stack
            question.cards = [question.person, question.room, question.weapon].filter(function (card) {
                return card;
            });
            console.log('ANS: ' + answerer);
            if (answerer !== -1 && !$global.players[answerer].detective) {
                // Step #5: Add remaining cards to a row in Answerer's maybe stack.

                $global.players[answerer].maybe.add(question.cards);
                
                console.log('added ' + question.cards + ' to ' + answerer);
                // Step #6: Check Answerer's maybes for any row with only one item.
  /*              // Step #7: For each such row:
                while ($global.players[answerer].maybe.length > 0 && $global.players[answerer].maybe.first().length === 1) {
                    var first = $global.players[answerer].maybe.pop()[0];

                    // Step #7.1: Add to Answerer's definite.
                    $global.players[answerer].sure.push(first);

                    // Step #7.2: Remove from master guess, definite, and from all players, possible and maybes.
                    $global.master.Guess[$scope.cardtype(first)] = $global.master.Guess[$scope.cardtype(first)].filter(function (card) {
                        return card.itm !== first;
                    });

                } //while...
*/
            } //if...

            //handle case where no one answeres, those cards must therefore be in either our hand, their hand, or the answer
            if (question.answerer === 'nobody') {
                console.log('nobody answered')
                console.log(question)

                var planswerer = $global.players.getByName(question.asker);

                if (planswerer.detective) {
                    for (var c of question.cards) {
                        console.log('update ' + c)
                        $global.master.Guess[$scope.cardtype(c)].update('itm', {
                            prob: 1,
                            itm: c
                        });
                    } //end for
                } else {
                    planswerer.maybe.add(question.cards);
                    for (var c of question.cards) {
                        console.log('update ' + c)

                        if (!~$.inArray(c, $global.players.getByName(question.asker).possible)) {
                            $global.master.Guess[$scope.cardtype(c)].update('itm', {
                                prob: 1,
                                itm: c
                            });
                        } else {
                            $global.master.Guess[$scope.cardtype(c)].update('itm', {
                                prob: 0.5,
                                itm: c
                            });
                        }
                    } //end for
                }
            } //endif nobody 


            // Step #8: If the Asker is on our right, create an empty array of probabilities then for each
            // card in the master guess, do:
            var guess = array($global.master.Guess.person).concat(array($global.master.Guess.room), array($global.master.Guess.weapon)).map(function (card) {
                return card.itm;
            });

            // update probabilities of all guesses
            /*for (var card of guess) {
                var updated = false,
                    probabilities = [];

                // Step #8.1: For each player in players do:
                for (var player of $global.players) {
                    if (!player.detective) {
                        // Step #8.1.1: For each row in player's maybes do:
                        for (var row of player.maybe) {
                            // Step #8.1.1.1: If row contains card, push 1 / row.length to array of probabilities.
                            if (row.indexOf(card) !== -1) {
                                probabilities.push(1 / row.length);
                                updated = true;
                            }
                        }
                    }
                }

                // Step #8.1.2: Multiply every element in the array by 1 / array.length.
                probabilities = probabilities.map(function (p) {
                    return p * (1 / probabilities.length);
                });

                // Step #8.1.3: Sum all elements in the array, and set the probability of
                // card in the master guess to 1 - sum.
                var sum = 0;
                probabilities.forEach(function (p) {
                    sum += p;
                });

                if (updated) {
                    $global.master.Guess[$scope.cardtype(card)].update('itm', {
                        prob: 1 - sum,
                        itm: card
                    });
                }
            }*/
            //} //<

            // ..
            console.log(JSON.stringify(question, null, 2));
            $global.alfred.output.say('Input command ...');
            $scope.$apply();
        } catch (e) {
            console.error(String(e));
            console.error(String(e.stack))
        }
    };

    // bind alfred's output to angular
    $scope.alout = '';
    $global.alfred.events.on('say', function (text) {
        $scope.$apply(function () {
            $scope.aloutput = text;
        });
    });

    // bind alfred's input to angular, and
    // record history of commands using a typeahead
    $scope.getinput = false;
    $scope.typeahead = ['Help me out.'];
    $scope.exec = function () {
        // fix up text
        var text = $('[ng-model="alinput"]').val();
        text = text[0].toUpperCase() + text.substr(1).toLowerCase();
        if (text[text.length - 1] !== '.') text += '.';

        // keep latest commands at the top of the list
        $scope.typeahead.push(text);
        $scope.typeahead = $scope.typeahead.filter(function (item, index, self) {
            item = item.toLowerCase();

            var n = -1;
            for (var i = 0; i < self.length; i += 1) {
                if (self[i].toLowerCase() === item) {
                    n = i;
                    break;
                }
            }

            return index === n;
        });

        // continue on next tick in order to force the
        // command to be asynchronous
        $scope.alinput = '';
        process.nextTick(function () {
            if ($scope.getinput) {
                $scope.getinput = false;
                $scope.$apply();
                $global.alfred.events.emit('input', text);
            } else $global.alfred.try(text);
        });
    };

    // bind to alfred
    $global.alfred.events.on('get-input', function () {
        $scope.getinput = true;
        $scope.$apply();
    });

    // wrap up with typeahead
    nextPort(function (err, port) {
        // simple echo server for echoing ajax
        require('http').Server(function (req, res) {
            res.end(JSON.stringify($scope.typeahead));
        }).listen(port);

        // keeping the source ajax-enabled allows for
        // dynamic updating
        $('[ng-model="alinput"]').typeahead({
            dynamic: true,
            source: {
                history: {
                    url: 'http://localhost:' + port + '/'
                }
            },
            order: 'asc',
            highlight: true
        });
    });

    // this switch allows us to toggle between the UI
    // displaying the master's info or a given player's
    // info
    $scope.isMaster = true;

    // this priority queue maintains the possibilities
    // of the murder, and their respective probability
    $scope.master = $global.master;
    $global.master.Guess = {
        room: priority('prob'),
        person: priority('prob'),
        weapon: priority('prob')
    };

    //initiate the master guess
    $global.cardset.rooms.forEach(function (room) {
        $global.master.Guess.room.add({
            prob: 0,
            itm: room
        });
    });
    $global.cardset.people.forEach(function (person) {
        $global.master.Guess.person.add({
            prob: 0,
            itm: person
        });
    });
    $global.cardset.weapons.forEach(function (weapon) {
        $global.master.Guess.weapon.add({
            prob: 0,
            itm: weapon
        });
    });

    // the player global will be the current selected
    // player in the UI, so we don't have to modify a whole
    // bunch of globals on player change
    $scope.player = {};

    // .load([id])
    // set the given player as the global/current player
    $scope.load = function (id) {
        $scope.isMaster = false;
        $scope.player = $global.players[id];
    };

    // .cardtype(card)
    // get card type
    $global.cardtype = $scope.cardtype = function (card) {
        if ($global.cardset.weapons.indexOf(card) !== -1) return 'weapon';
        if ($global.cardset.people.indexOf(card) !== -1) return 'person';

        return 'room';
    };

    // .getImagePath(img)
    // returns the path to the image on disk for a given card
    $scope.getImagePath = function (img) {
        return 'img/' + $scope.cardtype(img) + '/' + img.toLowerCase() + '.png';
    };

    // row type-things so we don't have to use null padding
    $scope.rowformat = function ($row, $type) {
        return $row.filter(function ($card) {
            return $global.cardtype($card) === $type;
        })[0];
    };

    // we use an array + an object to maintain the list of
    // players and their data so we can maintain and manipulate
    // order
    $scope.players = $global.players = [];
    $global.players.getByName = function (name) {
        var tgt = 'name';
        if ($.inArray(name, $global.cardset.people) != -1) {
            tgt = 'charName'
        }
        //console.log('using target %s searching for %s', tgt, name)
        return this.filter(function (p) {
            return p[tgt] === name
        })[0];

    };

    $scope.playerdata = {};

    $scope.host = 'localhost:1024';
    nextPort(function (err, port) {
        $scope.host = 'localhost:' + port;
        $scope.$apply();

        // start client server
        var express = require('express'),
            path = require('path'),
            app = express(),
            http = require('http').Server(app),
            io = require('socket.io')(http),
            crypto = require('crypto');

        // static serve
        app.use(function (req, res) {
            res.sendFile(path.resolve(__dirname, '.' + (req.path === '/' ? '/client.html' : req.path)));
        });

        // io handling
        io.on('connection', function (sock) {
            sock.on('init', function (who) {
                var player = $global.players.getByName(who),
                    send = true,
                    prev = null,
                    update = function () {
                        if (send) {
                            var data = {
                                    board: $global.board,
                                    players: $global.players,
                                    labels: require('./data/board.json').labels
                                },
                                hash = crypto.createHash('md5');

                            hash.update(JSON.stringify(data));
                            var current = hash.digest('hex');

                            if (prev !== current) {
                                sock.emit('data', data);
                                prev = current;
                            }

                            setTimeout(update, 100);
                        }
                    };

                handlers[who] = sock;

                sock.on('moved', function (loc) {
                    player.location = loc;
                    $scope.$apply();
                });

                sock.on('close', function () {
                    send = false;
                });

                update();
            });

            sock.emit('players', $global.players.map(function (player) {
                return player.charName;
            }));
        });

        // bind ui states to http status
        http.on('listening', function () {
            console.log('listening');
            $('#form-port .form-group')
                .addClass('has-success')
                .removeClass('has-error');
        });

        http.on('error', function () {
            console.log('error');
            $('#form-port .form-group')
                .removeClass('has-success')
                .addClass('has-error');
        });

        http.on('close', function () {
            console.log('closed');
            $('#form-port .form-group')
                .removeClass('has-success')
                .removeClass('has-error');
        });

        // listen up
        http.listen(port);

        // restarting on different port
        $scope.$watch('port', function (port) {
            http.close();

            if (port !== undefined) {
                setTimeout(function () {
                    console.log(':%s', port);
                    http.listen(port);
                }, 100);
            }
        });

        $scope.$apply(function () {
            $scope.port = port;
        });
    });
});
