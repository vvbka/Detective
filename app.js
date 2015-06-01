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

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var DetectiveWindow = null;

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
    DetectiveWindow = new BrowserWindow({
    width: 1200,
    height: 710
  });

  DetectiveWindow.loadUrl('file://' + __dirname + '/index.html');
  DetectiveWindow.openDevTools();
});
