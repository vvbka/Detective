/**
 * js/main.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('main', function($scope, $global) {
  'use strict';

  var priority = require('./lib/priority'),
      nextPort = require('next-port'),
      BayesClassifier = require('natural').BayesClassifier,
      strategies = require('./lib/strategy-controller')([
        'find'
      ]);

  // load classifiers
  $global.classifiers = {
    players: new BayesClassifier(),
    people: BayesClassifier.restore(require('./data/people-classifier.json')),
    rooms: BayesClassifier.restore(require('./data/rooms-classifier.json')),
    weapons: BayesClassifier.restore(require('./data/weapons-classifier.json'))
  };

  // make alfred globally available
  $global.alfred = require('alfred');
  $global.alfred.init([{
    prompts: ['help'],
    fn: function* () {
      $('<div class="modal fade" data-keyboard="true"> <div class="modal-dialog"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> <h4 class="modal-title">Detective | Help</h4> </div><div class="modal-body"> <p>You can find our documentation over <a href="http://bitbucket.org/vbka/detective/wiki/Home">here</a></p></div><div class="modal-footer"> <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> </div></div></div></div>').appendTo(document.body).modal('show').on('bs.modal.hidden', function() {
        $(this).remove();
      });
    }
  }, {
    prompts: ['* asked a question about * in the * with a *'],
    fn: function* (input) {
      // Step #1: Use NaiveBayes Classifier to parse
      // the question.
      var question = {
        asker: $global.classifiers.players.classify(input),
        answerer: $global.classifiers.players.classify(yield 'Who answered?'),
        person: $global.classifiers.people.classify(input),
        room: $global.classifiers.rooms.classify(input),
        weapon: $global.classifiers.weapons.classify(input)
      }, answerer, i;

      // create full card list
      question.cards = [question.person, question.room, question.weapon];

      // Step #2: Remove all three cards from possibles of all people between
      // who asked and who answered.
      for (i = 0; i < $global.players.length; i += 1)
        if ($global.players[i].name === question.asker)
          for (i = i + 1; i < $global.players.length; i += 1)
            if ($global.players[i].name === question.answerer) {
              answerer = i;
              i = $global.players.length;
              break;
            } else $global.players[i].possible = $global.players[i].possible.filter(function (item) {
              return !~ question.cards.indexOf(item);
            });

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
      question.person = $global.players[answerer].possible.filter(function (prsn) {
        return prsn === question.person;
      }).length > 0 ? question.person : null;

      question.room = $global.players[answerer].possible.filter(function (rm) {
        return rm === question.room;
      }).length > 0 ? question.room : null;

      question.weapon = $global.players[answerer].possible.filter(function (wpn) {
        return wpn === question.weapon;
      }).length > 0 ? question.weapon : null;

      // create clean stack
      question.cards = [question.person, question.room, question.weapon].filter(function (card) {
        return card;
      });

      // Step #5: Add remaining cards to a row in Answerer's maybe stack.
      $global.players[answerer].maybe.add(question.cards);

      // Step #6: Check Answerer's maybes for any row with only one item.
      // Step #7: For each such row:
      while ($global.players[answerer].maybe.first().length < 2) {
        var first = $global.players[answerer].maybe.pop()[0];

        // Step #7.1: Add to Answerer's definite.
        $global.players[answerer].sure.push(first);

        // Step #7.2: Remove from master guess, definite, and from all players, possible and maybes.
        $global.master.Guess.person = $global.master.Guess.person.filter(function (card) { return card !== first; });
        $global.master.Guess.room = $global.master.Guess.room.filter(function (card) { return card !== first; });
        $global.master.Guess.weapon = $global.master.Guess.weapon.filter(function (card) { return card !== first; });

        // Step #8: If the Asker is on our right, create an empty array of probabilities then for each
        // card in the master guess, do:
        // Step #8.1: For each player in players do:
        for (var player of $global.players) {
          // Step #8.1.1: For each row in player's maybes do:
          for (var row of player.maybe) {
            // Step #8.1.1.1: If row contains card, push 1 / row.length to array of probabilities.
            if (row.indexOf(first) !== -1) {
              console.log('::push(%s) to probabilties', 1 / row.length);
            }
          }
        }

        // Step #8.1.2: Multiply every element in the array by 1 / array.length.
        // WHAT ELEMENTS?!?!

        // Step #8.1.3: Sum all elements in the array, and set the probability of
        // card in the master guess to 1 - sum.
        // WHAT ARRAY?!?!
      }

      // ..
      console.log(JSON.stringify(question, null, 2));
      $global.alfred.output.say('Input command ...');
    }
  }]);

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
    $scope.typeahead = $scope.typeahead.filter(function(item, index, self) {
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
        $global.alfred.events.emit('input', text);
      } else $global.alfred.try(text);
    });
  };

  // bind to alfred
  $global.alfred.events.on('get-input', function () {
    $scope.getinput = true;
  });

  // wrap up with typeahead
  nextPort(function(err, port) {
    // simple echo server for echoing ajax
    require('http').Server(function(req, res) {
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
  $scope.masterGuess = $global.master.Guess = {
    room: priority('prob'),
    person: priority('prob'),
    weapon: priority('prob')
  };
  $scope.masterDefinite = $global.master.Definite = {
    person: '',
    room: '',
    weapon: ''
  };

  //initiate the master guess
  $global.cardset.rooms.forEach(function(room) {
    $global.master.Guess.room.add({
      prob: 1,
      itm: room
    });
  });
  $global.cardset.people.forEach(function(person) {
    $global.master.Guess.person.add({
      prob: 1,
      itm: person
    });
  });
  $global.cardset.weapons.forEach(function(weapon) {
    $global.master.Guess.weapon.add({
      prob: 1,
      itm: weapon
    });
  });


  // the player global will be the current selected
  // player in the UI, so we don't have to modify a whole
  // bunch of globals on player change
  $scope.player = {};

  // .load([id])
  // set the given player as the global/current player
  $scope.load = function(id) {
    $scope.isMaster = false;
    $scope.player = $global.players[id];
  };

  // .getImagePath(img)
  // returns the path to the image on disk for a given card
  $scope.getImagePath = function (img) {
    var type;

    if ($global.cardset.weapons.indexOf(img) !== -1) {
      type = 'weapon';
    } else if ($global.cardset.people.indexOf(img) !== -1) {
      type = 'person';
    } else {
      type = 'room';
    }

    return 'img/' + type + '/' + img.toLowerCase() + '.png';
  };

  // we use an array + an object to maintain the list of
  // players and their data so we can maintain and manipulate
  // order
  $scope.players = $global.players = [];
  $scope.playerdata = {};
});
