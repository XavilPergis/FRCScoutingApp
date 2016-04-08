'use strict';
const gulp = require('gulp');
const babel = require('gulp-babel');
const less = require('gulp-less');
const del = require('del');
const spawn = require('child_process').spawn;

gulp.task('babel', () => {
    gulp.src(['js/**.js'])
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('build/babel'));
});

gulp.task('less', () => {
    gulp.src(['css/**.less'])
        .pipe(less())
        .pipe(gulp.dest('build/css'));
});

gulp.task('serve', ['babel', 'less'], () => {
    let node = null;
    let server = () => {
        if(node) node.kill();
        node = spawn('node', ['index.js']);
        node.stdout.on('data', (data) => { process.stdout.write('OUT : ' + data) });
        node.stderr.on('data', (data) => { process.stderr.write('ERR : ' + data) });
        node.on('close', (code) => { console.log(`Process returned with code ${code}`); })
    }
    server();
    gulp.watch(['index.js'], server);
    gulp.watch(['js/**.js', '!build/**'], ['babel']);
    gulp.watch(['css/**.less', '!build/**'], ['less']);
});

gulp.task('less', () => {
    gulp.src('css/**.less')
        .pipe(less())
        .pipe(gulp.dest('build/css'));
});

gulp.task('clean', () => {
    del(['build']).then((paths) => {

    });
});
