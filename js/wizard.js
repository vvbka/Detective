/**
 * js/wizard.js - detective
 * all things binding and setup for the wizard.
 *
 * Licensed under GPLv3.
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('wizard', ['$scope', function ($scope) {
  $scope.players = global.players;
  $scope.masterDefinite = global.masterDefinite;
  $scope.cards = global.cardset.people.concat(global.cardset.rooms, global.cardset.weapons);
  $scope.myCards = [];
  $scope.add='Add a card';
  
  $scope.addToMyCards = function(){
    $scope.myCards.push($scope.add);
    $scope.add = '';
    console.log($scope.myCards);
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
}])

$('#wizard-init').steps({
  headerTag: 'h3',
  bodyTag: 'section',
  stepsOrientation: 'vertical'
});

$('#init-modal').modal('show');

$('.sortable').sortable({
  items: ':not(.disabled)'
});
