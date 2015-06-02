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
  $scope.add = '';

  $scope.chars = global.cardset.people;
  $scope.char2det = [, , , , , , , ];
  $scope.plnames = [, , , , , , , ];

  $scope.addToMyCards = function () {
    $scope.add = $scope.add.trim();
    console.log($scope.add);
    if ($scope.add) {
      $scope.myCards.push($scope.add);
      $scope.add = '';
      console.log($scope.myCards);
    }
  };

  $scope.setupPlayers = function () {
    $scope.plnames = $scope.plnames.filter(function (name) {
      return name;
    });

    var detindex = 0,
      i;
    for (i = 0; i < $scope.char2det.length; i += 1) {
      if ($scope.char2det[i]) {
        detindex = i;
        break;
      }
    }

    console.log($scope.plnames[detindex] + ' is detective (playing as ' + $scope.chars[detindex] + ')');
  };

  $('#wizard-init').on('finished', function () {
    $scope.$apply($scope.setupPlayers);
    $('#init-modal').modal('hide');
  });

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

  $scope.repeatDone = function () {
    
    $(document).on('ready', function () {
      $('#wizard-init').steps({
        headerTag: 'h3',
        bodyTag: 'section',
        stepsOrientation: 'vertical'
      });

       $('.sortable').sortable({
      items: ':not(.disabled)'
    });
      
      $('#init-modal').modal('show');
    });

  };
}])