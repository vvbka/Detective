/**
 * js/wizard.js - detective
 * all things binding and setup for the wizard.
 *
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

'use strict';

process.app.controller('wizard', function ($scope, $global) {
    var priority = require('./lib/priority'),
        capitalize = function (str) {
            return str.toLowerCase().split(/\s+/g).map(function (word) {
                return word[0].toUpperCase() + word.substr(1);
            }).join(' ');
        },
        locations = {
            'Mr. Green': [9, 24],
            'Ms. Scarlet': [16, 0],
            'Colonel Mustard': [23, 7],
            'Professor Plum': [0, 5],
            'Mrs. White': [14, 24],
            'Mrs. Peacock': [0, 18]
        },
        getStartingLocation = function (player) {
            return locations[player];
        };

    $scope.players = $global.players;
    $scope.masterDefinite = $global.masterDefinite;
    $scope.cards = $global.cardset.people.concat($global.cardset.rooms, $global.cardset.weapons);
    $scope.myCards = [];
    $scope.add = '';

    $scope.chars = $global.cardset.people;
    $scope.char2det = [, , , , , , , ];
    $scope.plnames = [, , , , , , , ];

    $scope.addToMyCards = function () {
        $scope.add = $('[ng-model="add"]').val().trim().toLowerCase().split(/\s+/g).map(function (name) {
            console.log(name);
            return name[0].toUpperCase() + name.substr(1);
        }).join(' ');

        if ($scope.add && $scope.myCards.indexOf($scope.add) === -1 && $scope.cards.indexOf($scope.add) !== -1) {
            console.log('adding: ' + $scope.add);
            $scope.myCards.push($scope.add);
        }

        $scope.add = '';
    };

    $scope.rmFromMyCards = function (index) {
        $scope.myCards = $scope.myCards.filter(function (elm, i) {
            return i !== index;
        });
    };

    $('[ng-model="add"]').typeahead({
        source: $scope.cards,
        order: 'asc',
        highlight: true,
        hint: true
    });

    $scope.setupPlayers = function () {
        var detindex = 0,
            i;

        for (i = 0; i < $scope.char2det.length; i += 1) {
            if ($scope.char2det[i]) {
                detindex = i;
                break;
            }
        }

        // initiate the Detective player
        $global.Detective.sure = $scope.myCards;
        $global.Detective.charName = $scope.chars[detindex];
        $global.Detective.name = capitalize($scope.plnames[detindex]);
        $global.Detective.turn = $('#playersSort li').index($('#playersSort').find('input:checked').parent());
        $global.Detective.detective = true;
        $global.Detective.location = getStartingLocation($scope.chars[detindex]);
        $global.locationSet();

        //initiate each new player
        $('#playersSort li').each(function (i) {
            if ($(this).find('input:checked').length != 1) {
                var cn = $(this).text().trim(),
                    newPlayer = {
                        name: capitalize($(this).find('input[type=text]').val().trim() || cn),
                        charName: capitalize(cn),
                        maybe: priority('length', function (a, b) {
                            return (a - b) < 0;
                        }),
                        sure: [],
                        turn: i,
                        shown: [],
                        ques: {},
                        possible: $scope.cards.filter(function (card) {
                            return ($global.Detective.sure.indexOf(card) == -1);
                        }),
                        location: getStartingLocation(cn)
                    };

                $global.players.push(newPlayer);
                $global.classifiers.players.addDocument(newPlayer.name, newPlayer.name);
            } else {
                $global.players.push($global.Detective);
                $global.classifiers.players.addDocument('I', $global.Detective.name);
                $global.classifiers.players.addDocument('Me', $global.Detective.name);
                $global.classifiers.players.addDocument($global.Detective.name, $global.Detective.name);
            }
        });

        //update master guess with new data - ie. Detectives cards are not to be considered.
        $global.master.Guess.person = $global.master.Guess.person.filter(function (card) {
            return !~$global.Detective.sure.indexOf(card.itm);
        });
        $global.master.Guess.room = $global.master.Guess.room.filter(function (card) {
            return !~$global.Detective.sure.indexOf(card.itm);
        });
        $global.master.Guess.weapon = $global.master.Guess.weapon.filter(function (card) {
            return !~$global.Detective.sure.indexOf(card.itm);
        });

        //add the corrent probability to the Master Guess, now that we have a proper length for it
        var newP = 1 / ($global.master.Guess.person.length + $global.master.Guess.room.length + $global.master.Guess.weapon.length);

        $global.master.Guess.person.forEach(function (pers) {
            $global.master.Guess.person.update('itm', {
                prob: newP,
                itm: pers.itm
            });
        });

        $global.master.Guess.room.forEach(function (rm) {
            $global.master.Guess.room.update('itm', {
                prob: newP,
                itm: rm.itm
            });
        });

        $global.master.Guess.weapon.forEach(function (wep) {
            $global.master.Guess.weapon.update('itm', {
                prob: newP,
                itm: wep.itm
            });
        });


        var observe = function (obj, key, fn) {
                var val = obj[key];
                if (val instanceof Array) Array.observe(val, fn);

                Object.defineProperty(obj, key, {
                    get: function () {
                        return val;
                    },

                    set: function (value) {
                        val = value;
                        if (val instanceof Array) Array.observe(val, fn);
                        fn();
                    }
                });
            },
            possibleUpdater = function (player) {
                return function () {
                    // filter maybes to fit possibles
                    player.maybe = player.maybe.map(function (maybe) {
                        return maybe.filter(function (card) {
                            return ~player.possible.indexOf(card);
                        });
                    });

                    // update single row maybes
                    while (player.maybe.length > 0 && player.maybe.first().length === 1) {
                        var first = player.maybe.pop()[0];

                        // Step #7.1: Add to Answerer's definite.
                        player.sure.push(first);

                        // Step #7.2: Remove from master guess, definite, and from all players, possible and maybes.
                        $global.master.Guess[$scope.cardtype(first)] = $global.master.Guess[$scope.cardtype(first)].filter(function (card) {
                            return card.itm !== first;
                        });
                    }

                    // update scope
                    try {
                        $scope.$apply();
                    } catch (e) { /* ignore angular */ }
                };
            };

        // add auto-updating for maybes
        for (var player of $global.players) {
            if (!player.detective) {
                observe(player, 'possible', possibleUpdater(player));
            }
        }

        //and 'nobody' as a potetntial answerer
        $global.classifiers.players.addDocument('nobody', 'nobody');
        $global.classifiers.players.addDocument('no one', 'nobody');
        $global.classifiers.players.train();
    };

    // .players.add([name])
    // adds a player to the game (in the next player position)
    // -> player position can be modified through the UI
    $scope.players.add = function (player) {
        $scope.players.push(player);
        $scope.playerdata[player] = {
            maybe: priority('length'),
            sure: []
        };
    };

    // .players.rm([index])
    // remove a player at a specific position
    // using a position over a name makes it easier for angular
    $scope.players.rm = function (at) {
        var who = $scope.players[at];
        $scope.players = $scope.players.slice(0, at).concat($scope.players.slice(at + 1));
        delete $scope.playerdata[who];
    };

    // .load([name])
    // set the given player as the global/current player
    $scope.players.load = function (name) {
        $scope.isMaster = false;
        $scope.player = $scope.playerdata[name];
    };

    //fires once the ng-repeat is complete
    $scope.repeatDone = function () {
        $(document).on('ready', function () {
            $('.sortable').sortable({
                items: ':not(.disabled)',
                connectWith: '.connected'
            });

            $('#init-modal-players').modal('show');
        });
    };

    //Steps the wizard forward, checks for validation on page 1.
    $scope.wizNext = function () {
        if ($('#playersSort li').find('input:checked').length != 1) {
            alert('Please identify Detective as one (and only one) player!')
        } else {
            for (var i = 0; i < $scope.plnames.length; i += 1) {
                if (!$scope.plnames[i]) {
                    $('[data-cid="' + i + '"]').remove().appendTo($('#unusedPlayers'));
                }
            }

            $('#init-modal-players').modal('hide');
            $('#init-modal-cards').modal('show');
        }
    };

    //Finish the wizzard, and validate the last page
    $scope.wizDone = function () {
        if ($scope.myCards.length > 0) {
            $('#init-modal-cards').modal('hide');
            $scope.setupPlayers();

            setTimeout(function () {
                $('.splash').fadeOut();
                $('.full-container').fadeIn();
            }, 300);
        } else {
            alert('Please add the cards in your hand!');
        }
    };

});
