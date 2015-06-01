/**
 * app.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

'use strict';

var app = require('app'),
    BrowserWindow = require('browser-window');

// report crashes for electron
require('crash-reporter').start();

// apparently everything other than OSX needs to be
// manually quitted
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// prepare for full init from electron, then do
// our stuff
app.on('ready', function () {
  var win = new BrowserWindow({
    width: 1200,
    height: 710
  });

  win.loadUrl('file://' + __dirname + '/index.html');
  win.openDevTools();
});
