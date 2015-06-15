/**
 * gulpfile.js - detective
 * Licensed under MIT.
 * Copyright (C) 2015 VBKA. 
 **/

'use strict';

var gulp = require('gulp'),
    beautify = require('gulp-jsbeautifier');

gulp.task('default', function () {
    return gulp.src(['*.js', 'lib/**/**.js', 'js/**/**.js'])
        .pipe(beautify({
            js: {
                jslintHappy: true
            }
        }))
        .pipe(gulp.dest(function (data) {
            return data.base;
        }));
});
