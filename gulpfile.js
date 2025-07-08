const gulp = require('gulp');
const terser = require('gulp-terser');
const csso = require('gulp-csso');
const htmlmin = require('gulp-htmlmin');


// Minify HTML and copy to dist
gulp.task('minify-html', () => {
    console.log('Minifying HTML...');
    return gulp.src('*.html')
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(gulp.dest('YSN/dist'));
});

// Default task
gulp.task('default', gulp.parallel('minify-html'));