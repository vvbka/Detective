/**
 * app.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA.
 **/

'use strict';

var app = require('app'),
    BrowserWindow = require('browser-window'),
    Menu = require('menu');

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

var MenuTemplate = [{
    label: 'Electron',
    submenu: [{
        label: 'About Electron',
        selector: 'orderFrontStandardAboutPanel:'
    }, {
        type: 'separator'
    }, {
        label: 'Services',
        submenu: []
    }, {
        type: 'separator'
    }, {
        label: 'Hide Electron',
        accelerator: 'Command+H',
        selector: 'hide:'
    }, {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
    }, {
        label: 'Show All',
        selector: 'unhideAllApplications:'
    }, {
        type: 'separator'
    }, {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: function () {
            app.quit();
        }
    }, ]
}, {
    label: 'Edit',
    submenu: [{
        label: 'Undo',
        accelerator: 'Command+Z',
        selector: 'undo:'
    }, {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        selector: 'redo:'
    }, {
        type: 'separator'
    }, {
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
    }, {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
    }, {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
    }, {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
    }, ]
}, {
    label: 'View',
    submenu: [{
        label: 'Reload',
        accelerator: 'Command+R',
        click: function () {
            BrowserWindow.getFocusedWindow().reloadIgnoringCache();
        }
    }, {
        label: 'Toggle DevTools',
        accelerator: 'Alt+Command+I',
        click: function () {
            BrowserWindow.getFocusedWindow().toggleDevTools();
        }
    }, ]
}, {
    label: 'Window',
    submenu: [{
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:'
    }, {
        label: 'Close',
        accelerator: 'Command+W',
        selector: 'performClose:'
    }, {
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
    }, ]
}, ];

// prepare for full init from electron, then do
// our stuff
app.on('ready', function () {
    DetectiveWindow = new BrowserWindow({
        width: 1200,
        height: 710,
        icon: __dirname + '/img/icon-128x128.png'
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate(MenuTemplate));

    DetectiveWindow.loadUrl('file://' + __dirname + '/index.html');
    if (process.env.NODE_ENV === 'development') DetectiveWindow.openDevTools();
    DetectiveWindow.maximize();
});
