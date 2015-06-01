/**
 * js/main.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('main', ['$scope', function ($scope) {

  'use strict';

  var priority = require('./lib/priority'),
      strategies = require('./lib/strategy-controller')([
        'find'
      ]);

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
