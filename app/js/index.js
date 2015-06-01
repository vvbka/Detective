/**
 * js/main.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('main', ['$scope', function ($scope) {

  'use strict';

  var priority = require('../lib/priority');

  // this switch allows us to toggle between the UI
  // displaying the master's info or a given player's
  // info
  $scope.isMaster = true;

  // this priority queue maintains the possibilities
  // of the murder, and their respective probability
  $scope.masterGuess = priority();

  // the player global will be the current selected
  // player in the UI, so we don't have to modify a whole
  // bunch of globals on player change
  $scope.player = {};

  // we use an array + an object to maintain the list of
  // players and their data so we can maintain and manipulate
  // order
  $scope.players = [];
  $scope.playerdata = {};

  // .addPlayer([name])
  // adds a player to the game (in the next player position)
  // -> player position can be modified through the UI
  $scope.addPlayer = function (player) {
    $scope.players.push(player);
    $scope.playerdata[player] = {
      maybe: priority('length'),
      sure: []
    };
  };

  // .rmPlayer([index])
  // remove a player at a specific position
  // using a position over a name makes it easier for angular
  $scope.rmPlayer = function (at) {
    var who = $scope.players[at];
    $scope.players = $scope.players.slice(0, at).concat($scope.players.slice(at + 1));
    delete $scope.playerdata[who];
  };

  // .load([name])
  // set the given player as the global/current player
  $scope.load = function (name) {
    $scope.isMaster = false;
    $scope.player = $scope.playerdata[name];
  };

}])
