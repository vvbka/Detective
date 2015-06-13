/**
 * js/wizard.js - detective
 * all things binding and setup for the wizard.
 *
 * Licensed under GPLv3.
 * Copyright (C) 2015 VBKA.
 **/

'use strict';

process.app.controller('wizard', function ($scope, $global) {
    var priority = require('./lib/priority'),
        format = require('util').format,
        getStartingLocation = function (player) {
            switch (player) {
            case 'Mr. Green':
                return [9, 24];
            case 'Ms. Scarlet':
                return [16, 0];
            case 'Colonel Mustard':
                return [23, 7];
            case 'Professor Plum':
                return [0, 5];
            case 'Mrs. White':
                return [24, 14];
            case 'Mrs. Peacock':
                return [0, 18];

            }
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
        $global.Detective.name = $scope.plnames[detindex] || 'Detective';
        $global.Detective.turn = $('#playersSort li').index($('#playersSort').find('input:checked').parent());
        $global.Detective.detective = true;
        $global.Detective.location = getStartingLocation($scope.chars[detindex]);

        //initiate each new player
        $('#playersSort li').each(function (i) {
            if ($(this).find('input:checked').length != 1) {
                var cn = $(this).text().trim(),
                    newPlayer = {
                        name: $(this).find('input[type=text]').val().trim() || cn,
                        charName: cn,
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
        var newP = 1/($global.master.Guess.person.length + $global.master.Guess.room.length + $global.master.Guess.weapon.length);
         
        $global.master.Guess.person.forEach(function(pers){
            $global.master.Guess.person.update('itm', {prob:newP, itm:pers.itm});
        });
        
        $global.master.Guess.room.forEach(function(rm){
            $global.master.Guess.room.update('itm', {prob:newP, itm:rm.itm});
        });
        
        $global.master.Guess.weapon.forEach(function(wep){
            $global.master.Guess.weapon.update('itm', {prob:newP, itm:wep.itm});
        });
        
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
