'use strict';

const gulp = require('gulp');
const less = require('gulp-less');
const todo = require('gulp-todo');

gulp.task('render_less', () => {
    gulp.src('css/*.less')
        .pipe(less())
        .pipe(gulp.dest('build'));
});

gulp.task('default', ['render_less']);
