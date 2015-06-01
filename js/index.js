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

  // bind alfred's input to angular
  $scope.exec = function (text) {
    $scope.alinput = '';
    process.nextTick(function () {
      alfred.try(text)
    });
  };

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
