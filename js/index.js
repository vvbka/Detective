/**
 * js/main.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/
global.cardset = {}, global.master = {};
global.cardset.people = ['Ms. Scarlet', 'Colonel Mustard', 'Professor Plum', 'Mr. Green', 'Mrs. White', 'Mrs. Peacock'];
global.cardset.rooms = ['Ballroom', 'Billards Room', 'Conservatory', 'Dining Room', 'Hall', 'Kitchen', 'Lounge', 'Study'];
global.cardset.weapons = ['Axe', 'Bomb', 'Candlestick', 'Knife', 'Pipe', 'Poison', 'Revolver', 'Rope', 'Syringe', 'Wrench'];


process.app.controller('main', ['$scope', function ($scope) {

  'use strict';

  window.$scope = $scope;


  var alfred = require('alfred'),
    priority = require('./lib/priority'),
    nextPort = require('next-port'),
    strategies = require('./lib/strategy-controller')([
        'find'
      ]);

  // load up all the turn commands with alfred
  alfred.init([
    {
      prompts: ['* asked a question about *, *, and *'],
      fn: function () {
        //
      }
    },
    {
      prompts: ['help'],
      fn: function () {
        $('<div class="modal fade" data-keyboard="true"> <div class="modal-dialog"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> <h4 class="modal-title">Detective | Help</h4> </div><div class="modal-body"> <p>You can find our documentation over <a href="http://bitbucket.org/vbka/detective/wiki/Home">here</a></p></div><div class="modal-footer"> <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> </div></div></div></div>').appendTo(document.body).modal('show').on('bs.modal.hidden', function () {
          $(this).remove();
        });
      }
    }
  ]);

  // bind alfred's output to angular
  $scope.alout = '';
  alfred.events.on('say', function (text) {
    $scope.$apply(function () {
      $scope.aloutput = text;
    });
  });

  // bind alfred's input to angular, and
  // record history of commands using a typeahead
  $scope.typeahead = ['Hello, there.'];
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
      alfred.try(text);
      console.log($scope.typeahead);
    });
  };

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
  $scope.masterGuess = global.master.Guess = {
    room: priority('prob'),
    person: priority('prob'),
    weapon: priority('prob')
  };
  $scope.masterDefinite = global.master.Definite = {
    person: '',
    room: '',
    weapon: ''
  };

  //initiate the master guess
  global.cardset.rooms.forEach(function ( room) {
    global.master.Guess.room.add({prob: 1,itm: room});
  });
  global.cardset.people.forEach(function (person) {
    global.master.Guess.person.add({prob: 1,itm: person});
  });
  global.cardset.weapons.forEach(function (weapon) {
    global.master.Guess.weapon.add({prob: 1, itm: weapon});
  });
  

  // the player global will be the current selected
  // player in the UI, so we don't have to modify a whole
  // bunch of globals on player change
  $scope.player = {};

  // .load([id])
  // set the given player as the global/current player
  $scope.load = function (id) {
    $scope.isMaster = false;
    $scope.player = global.players[id];
  };

  //.getImagePath(img)
  //returns the path to the image on disk for a given card
  $scope.getImagePath = function (img) {
    var type;
    if ($.inArray(img, global.cardset.weapons) != -1) {
      type = 'weapon'
    };
    if ($.inArray(img, global.cardset.people) != -1) {
      type = 'person'
    };
    if ($.inArray(img, global.cardset.rooms) != -1) {
      type = 'room'
    };

    //console.log(img + ' is '+type);

    return 'img/' + type + '/' + img.toLowerCase() + '.png';
  };

  // we use an array + an object to maintain the list of
  // players and their data so we can maintain and manipulate
  // order
  $scope.players = global.players = [];
  $scope.playerdata = {};

}])