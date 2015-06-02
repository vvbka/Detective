/**
 * lib/klass.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

var fishbone = require('./fishbone'),
    EventEmitter = require('eventemitter2').EventEmitter2,
    inherits = require('./inherits');

module.exports = function (map) {
  var Klass = fishbone(map);
  return inherits(Klass, EventEmitter);
};
