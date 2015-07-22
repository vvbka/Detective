/**
 * gulpfile.js - detective
 * Licensed under GPLv2.
 * Copyright (C) 2015 VVBKA. 
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
