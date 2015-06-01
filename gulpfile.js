/**
 * gulpfile.js - detective
 * build file for detective.
 *
 * Licensed under MIT.
 **/

"use strict"

var gulp = require('gulp')
  , rimraf = require('rimraf')
  , chug = require('gulp-chug')
  , NodeWebkitBuilder = require('node-webkit-builder')

gulp.task('build', function () {
    return gulp.src(['./app/gulpfile.js']).pipe(chug())
})

gulp.task('clean', function (cb) {
  rimraf('./app/build', function () {
    rimraf('./app/cache', cb)
  })
})

gulp.task('default', ['build'], function (cb) {
    process.chdir('app')

    var nw = new NodeWebkitBuilder({
        files: ['./package.json', './**/**']
      , platforms: process.env.HOST_OS ? [process.env.HOST_OS] : ['linux32', 'osx64']
      , version:'0.12.0'
    })

    nw.on('log', console.log.bind(console))

    nw.build(function (err) {
        if (err) console.error(err)
        cb(err)
    })
})
