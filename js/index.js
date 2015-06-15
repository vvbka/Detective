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

    var priority = require('./lib/priority'),
        nextPort = require('next-port'),
        BayesClassifier = require('natural').BayesClassifier,
        array = Array.prototype.slice.call.bind(Array.prototype.slice);

    // load classifiers
    $global.classifiers = {
        players: new BayesClassifier(),
        people: BayesClassifier.restore(require('./data/people-classifier.json')),
        rooms: BayesClassifier.restore(require('./data/rooms-classifier.json')),
        weapons: BayesClassifier.restore(require('./data/weapons-classifier.json')),
        cards: BayesClassifier.restore(require('./data/cards-classifier.json'))
    };

    // make alfred globally available
    $global.alfred = require('alfred');
    $global.alfred.init([{
        prompts: ['help'],
        fn: function* () {
            $('<div class="modal fade" data-keyboard="true"> <div class="modal-dialog"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> <h4 class="modal-title">Detective | Help</h4> </div><div class="modal-body"> <p>You can find our documentation over <a href="http://bitbucket.org/vbka/detective/wiki/Home">here</a></p></div><div class="modal-footer"> <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> </div></div></div></div>').appendTo(document.body).modal('show').on('bs.modal.hidden', function () {
                $(this).remove();
            });
        }
    }, {
        prompts: ['* asked a question about * in the * with a *'],
        fn: function* (input) {
            var question = {
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
                        $global.alfred.output.say('Input Command...');
                        $scope.$apply();
                    }, 3000)
                    return ret

                } else {
                    console.log('Detective Can\'t Answer!')
                    question.answerer = $global.classifiers.players.classify(yield 'I\'m Sorry, I can\'t Answer.  Who was able to?')
                }
            }
            $global.handleTurn(question);

        }
    }, {
        prompts: ['it is my turn', 'it\'s my turn', 'gimme a question to ask', 'handle my turn', 'my turn'],
        fn: function* () {
            if(($global.master.Guess.person.first().prob * $global.master.Guess.room.first().prob * $global.master.Guess.weapon.first().prob) > $global.threshold ) {
                var ans = 'It was '+ $global.master.Guess.person.first().itm + ' in the ' + $global.master.Guess.room.first().itm + ' with a ' + $global.master.Guess.weapon.first().itm+'?',
                    resp = yield(ans);
                    if(~resp.toLowerCase().indexOf('n')) {
                        window.alert("You LOST!!! :(");
                    } else {window.alert('You Won!!! YAY!!')}
            } else {
                $global.myTurn();
            }
        }
    }, {
        prompts: ['* moved'],
        fn: function* (input) {
            var player = $global.classifiers.players.classify(input);
            $global.movePlayer(player);
        }
    },
    {
        prompts: ['set threshold *'],
        fn: function* (input) {
            var newThresh = input.split(/\s+/g).map(function (n) {
                        return parseFloat(n);
                    }).filter(function (n) {
                        return !isNaN(n);
                    });
            $global.threshold = newThresh;
            console.log('set threshold to be '+$global.threshold)
        }
    }
    ]);


    $global.handleTurn = function (question) {
        console.log(question);
        // Step #1: Use NaiveBayes Classifier to parse
        // the question.
        var answerer = -1,
            asker,
            i;

        // create full card list
        question.cards = [question.person, question.room, question.weapon];

        //try {
        // Step #2: Remove all three cards from possibles of all people between
        // who asked and who answered.
        //1. get the index of the asker
        for (i = 0; i < $global.players.length; i += 1) {
            if ($global.players[i].name === question.asker) {
                asker = i;
                console.log("asker %s found at %d", $global.players[i].name, asker);
            }
        }

        for (i = asker; i < $global.players.length; i += 1) {
            //console.log('INDEX: '+ i);
            if ($global.players[i].name === question.answerer) {
                answerer = i;
                i = $global.players.length;
                console.log('found answerer ' + $global.players[answerer].name + ' at ' + answerer);
                break;
            } //end if
            //console.log(i + ' : ' + $global.players[i].name !== $global.Detective.name && i !== asker);
            if ($global.players[i].name !== $global.Detective.name && i !== asker) {
                console.log('ELIMINATE FROM: ' + $global.players[i].name);
                $global.players[i].possible = $global.players[i].possible.filter(function (item) {
                    return !~question.cards.indexOf(item);
                });
            } //end if
            if (i === $global.players.length - 1) {
                i = -1; //console.log("Reached the end of players, looking from top");
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

        // Step #4: Eliminate cards remaining in the question which are NOT
        // in the Answerer's possibles.
        if (answerer !== -1) {
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

        if (answerer !== -1) {
            // Step #5: Add remaining cards to a row in Answerer's maybe stack.
            //but first, let's space them out properly if we need to.
            /*if (question.cards.length < 3) {
                var cardStore = [null, null, null];
                for (var c of question.cards) {
                    var t = $scope.cardtype(c);
                    switch (t) {
                    case ('person'):
                        cardStore[0] = c;
                        break;
                    case ('room'):
                        cardStore[1] = c;
                        break;
                    case ('weapon'):
                        cardStore[2] = c;
                        break;
                    };
                };
                question.cards = cardStore;
            }*/

            $global.players[answerer].maybe.add(question.cards);

            // Step #6: Check Answerer's maybes for any row with only one item.
            // Step #7: For each such row:
            while ($global.players[answerer].maybe.length > 0 && $global.players[answerer].maybe.first().length === 1) {
                var first = $global.players[answerer].maybe.pop()[0];

                // Step #7.1: Add to Answerer's definite.
                $global.players[answerer].sure.push(first);

                // Step #7.2: Remove from master guess, definite, and from all players, possible and maybes.
                $global.master.Guess[$scope.cardtype(first)] = $global.master.Guess[$scope.cardtype(first)].filter(function (card) {
                    return card.itm !== first;
                });

            } //while...

        } //if...

        //handle case where no one answeres, those cards must therefore be in either our hand, their hand, or the answer
        if (question.answerer === 'nobody') {
            console.log('nobody answered')
            for (var c of question.cards) {
                console.log('update ' + c)
                if (!~$.inArray(c, $global.players[$global.players.getByName(question.asker)].possible)) {
                    $global.master.Guess[$scope.cardtype(c)].update('itm', {
                        prob: 1,
                        itm: c
                    });
                } else {
                    $global.players[$global.players.getByName(question.asker)].maybe.add(question.cards);
                    $global.master.Guess[$scope.cardtype(c)].update('itm', {
                        prob: 0.5,
                        itm: c
                    });
                }

            } //end for
        } //endif nobody 


        // Step #8: If the Asker is on our right, create an empty array of probabilities then for each
        // card in the master guess, do:
        var guess = array($global.master.Guess.person).concat(array($global.master.Guess.room), array($global.master.Guess.weapon)).map(function (card) {
            return card.itm;
        });

        // update probabilities of all guesses
        for (var card of guess) {
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
        }
        //} //<

        // ..
        console.log(JSON.stringify(question, null, 2));
        $global.alfred.output.say('Input command ...');
        $scope.$apply();
        //} catch (e) {
        //    console.error(String(e));
        //    console.error(String(e.stack))
        //}
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
});
