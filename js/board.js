/**
 * js/board.js - detective
 * Copyright (C) 2015 VBKA.
 **/

process.app.controller('BoardController', function ($scope, $global) {
  'use strict';
  
  $scope.board = require('./data/board.json');
  $scope.labels = {
    '1,2': 'Study',
    '3,11': 'Hall',
    '3,19': 'Lounge',
    '11,18': 'Dining Room',
    '20,20': 'Kitchen',
    '20,10': 'Ballroom',
    '20,1': 'Conservatory',
    '13,1': 'Billiard Room',
    '8,2': 'Library',
    
    
  };
});