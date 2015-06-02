/**
 * js/main.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('main', ['$scope', function ($scope) {

  'use strict';

  window.$scope  = $scope;

  var alfred = require('alfred'),
      priority = require('./lib/priority'),
      nextPort = require('next-port'),
      strategies = require('./lib/strategy-controller')([
        'find'
      ]);

  // load up all the turn commands with alfred
  alfred.init(require('./lib/commands.js'));

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

      var n= -1;
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
  $scope.masterGuess = priority();
  $scope.masterDefinite = global.masterDefinite = {
    people: [],
    places: [],
    weapons: []
  };

  // the player global will be the current selected
  // player in the UI, so we don't have to modify a whole
  // bunch of globals on player change
  $scope.player = {};

  // we use an array + an object to maintain the list of
  // players and their data so we can maintain and manipulate
  // order
  $scope.players = global.players = [];
  $scope.playerdata = {};
}])
