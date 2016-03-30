'use strict';

const   del = require('del');
const  gulp = require('gulp');
const  less = require('gulp-less');
const  todo = require('gulp-todo');
const  docs = require('gulp-documentation');
const spawn = require('child_process').spawn;
const mainBowerFiles = require('main-bower-files');
var node;

// SOURCES ---------------------------------------------------------------------
const LESS_FILES = ['./client/css/*.less'];
const   JS_FILES = ['./index.js', 'client/js/*.js'];
const  CLI_FILES = ['./client/**'];
const  DOC_FILES = ['./docs/**'];
const  ANY_FILES = ['**', '!./build/**'];

// DESTINATIONS ----------------------------------------------------------------
const BOWER_TARGET = 'client/build';
const  LESS_TARGET = 'client/build';

gulp.task('clean-docs', () => {
    del(DOC_FILES).then((paths) => {
        if(paths.length === 0) {
            console.log('Nothing to clean!');
        } else {
            console.log(`Cleaned:\n\t${paths.reverse().join('\n\t')}`);
        }
    });
});

gulp.task('clean-build', () => {
    del(['./client/build/**']).then((paths) => {
        if(paths.length === 0) {
            console.log('Nothing to clean!');
        } else {
            console.log(`Cleaned:\n\t${paths.reverse().join('\n\t')}`);
        }
    });
});

gulp.task('doc', ['clean-docs'], () => {
    let type = require('yargs').argv.type || 'md';
    gulp.src(JS_FILES)
    .pipe(docs({ format: type }))
    .pipe(gulp.dest('docs'))
});

gulp.task('render-less', () => {
    gulp.src(LESS_FILES)
        .pipe(less())
        .pipe(gulp.dest(LESS_TARGET));
});

gulp.task('bower-files', () => {
    gulp.src(mainBowerFiles())
        .pipe(gulp.dest(BOWER_TARGET));
});

// SOURCE: `webdesserts` at (https://gist.github.com/webdesserts/5632955)

gulp.task('server', () => {
    // Stop server if another one was running
    if(node) node.kill();
    // Start new node server
    node = spawn('node', ['index.js'], { stdio: 'inherit' });
    node.on('close', (code) => {
        if(code === 8) gulp.log('Error detected, waiting for changes...');
    });
});

// Watch for filechanges and restart if needed
gulp.task('serve', ['build', 'server'], () => {
    gulp.watch(JS_FILES, ['server']);
    gulp.watch(LESS_FILES, ['render-less']);
});

// clean up if an error goes unhandled.
process.on('exit', () => {
    if(node) node.kill();
});

gulp.task('default', ['watch', 'render-less']);
gulp.task('build', ['clean-build', 'render-less', 'bower-files'], () => {

});
