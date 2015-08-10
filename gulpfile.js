'use strict';

var autoprefixer = require('gulp-autoprefixer');
var chalk = require('chalk');
var concat = require('gulp-concat');
var connect = require('connect');
var copy = require('gulp-contrib-copy');
var del = require('del');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var jade = require('gulp-jade');
var livereload = require('gulp-livereload');
var minifyCss = require('gulp-minify-css');
var serveStatic = require('serve-static');
var sourcemaps = require('gulp-sourcemaps');
var stylus = require('gulp-stylus');
var watch = require('gulp-watch');

/**
 * Print to console in gulp style
 * [hours:minutes:seconds] Some text
 * @param  {string} string Printed string, text in {curly braces}
 *                         will be printed cyan color
 */
var consolePrint = function(string){
  var time = (function(){
    var timeRaw = new Date();
    var time = {};
    time.hours = timeRaw.getHours().toString();
    time.mins = timeRaw.getMinutes().toString();
    time.secs = timeRaw.getSeconds().toString();
    time.hours = time.hours.length === 1 ? '0' + time.hours : time.hours;
    time.mins = time.mins.length === 1 ? '0' + time.mins : time.mins;
    time.secs = time.secs.length === 1 ? '0' + time.secs : time.secs;
    return time.hours + ':' + time.mins + ':' + time.secs;
  })();
  var res = '';
  res += chalk.white('['); 
  res += chalk.gray(time);
  res += chalk.white(']' + ' ');
  string = string.replace(/\{(.*)\}/i, '\'' + chalk.cyan('$1') + '\'')
  res += string;
  console.log(res);
  return;
};

/**
 * Development?
 */
var isDev = false;

/**
 * Pathes for source, dist and files.
 */
var paths = {
  dist: {
    dirs: {
      assets: './dist/assets',
      css: './dist/static/css',
      index: './dist',
      html: './dist',
      js: './dist/static/js',
    }
  },
  src: {
    dirs: {
      assets: ['./src/assets/**/*'],
      css: ['./src/css/*.css'],
      cssvendors: ['./src/vendors/*.css'],
      html: ['./src/html/**/*.html'],
      jade: ['./src/jade/**/*.jade'],
      js: ['./src/js/**/*.js'],
      stylus: ['./src/styl/**/*.styl'],
    },
    files: {
      jade: ['./src/jade/*.jade'],
      js: ['./src/js/*.js'],
      stylus: ['./src/styl/*.styl'],
    },
    misc: {
      css: './src/css',
    }
  },
};

/**
 * For some data to jade templates
 */
var jadeData = {};

/**
 * Tasks list
 */
var tasks = ['clean', 'assets', 'html', 'cssvendors', 'css', 'js'];

/**
 * Funcs list
 */
var funcs = {};

funcs.all = function() {
  funcs.clean(function() {
    funcs.assets();
    funcs.html();
    funcs.cssvendors();
    funcs.css();
    funcs.js();

    // hack :(
    // @TODO: Rethink
    setTimeout(function() {
      livereload.reload();
    }, 1000);
  });
};

/**
 * Clean dist path
 * @param  {Function} cb Callback
 */
funcs.clean = function(cb) {
  consolePrint('Cleaning {dist}');

  del(paths.dist.dirs.index, cb);
  return;
};

gulp.task('clean', funcs.clean);

/**
 * Copying assets (img, video or smthg else)
 */
funcs.assets = function() {
  consolePrint('Copying {assets}');

  gulp.src(paths.src.dirs.assets)
    .pipe(copy())
    .pipe(gulp.dest(paths.dist.dirs.assets));
  return;
};

gulp.task('assets', ['clean'], funcs.assets);

/**
 * Compile jade to html
 */
funcs.html = function() {
  consolePrint('Changing {htmls}');

  gulp.src(paths.src.files.jade)
    .pipe(gulpif(
      !isDev,
      jade({
        locals: jadeData
      }),
      jade({
        locals: jadeData,
        pretty: '  '
      })
    ))
    .pipe(gulp.dest(paths.dist.dirs.html));
  return;
};

gulp.task('html', ['clean'], funcs.html);

/**
 * Compile stylus to css
 */
funcs.css = function() {
  consolePrint('Changing {styles}');

  gulp.src(paths.src.files.stylus)
    .pipe(stylus())
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'ie 8'],
    }))
    // .pipe(sourcemaps.init())
    // .pipe(sourcemaps.write('.'))
    .pipe(gulpif(!isDev, minifyCss()))
    .pipe(gulp.dest(paths.src.misc.css));

  gulp.src(paths.src.dirs.css)
    .pipe(concat('style.css'))
    .pipe(gulp.dest(paths.dist.dirs.css));
  return;
};

gulp.task('css', ['clean'], funcs.css);

/**
 * Copying css vendors to temp dir
 */
funcs.cssvendors = function() {
  consolePrint('Rebuild {vendor\'s css}');

  gulp.src(paths.src.dirs.cssvendors)
    .pipe(gulpif(!isDev, minifyCss()))
    .pipe(gulp.dest(paths.src.misc.css));
  return;
};

gulp.task('cssvendors', ['clean'], funcs.cssvendors);

/**
 * Copying js
 */
funcs.js = function() {
  consolePrint('Copying {js}');

  gulp.src(paths.src.dirs.js)
    .pipe(copy())
    .pipe(gulp.dest(paths.dist.dirs.js));
  return;
};

gulp.task('js', ['clean'], funcs.js);

/**
 * Run server
 */
funcs.server = function() {
  connect()
    .use(serveStatic(__dirname + paths.dist.dirs.index.slice(1), {
      lastModified: false,
      maxAge: '1s'
    }))
    .listen('3000');

  consolePrint('Development server run at {http://localhost:3000/}');
  consolePrint('Open in your browser');
  return;
};

gulp.task('server', funcs.server);

/**
 * Watch changing
 */
gulp.task('watch', function() {
  livereload.listen();

  watch(paths.src.dirs.assets, funcs.all);
  watch(paths.src.dirs.cssvendors, funcs.all);
  watch(paths.src.dirs.jade, funcs.all);
  watch(paths.src.dirs.js, funcs.all);
  watch(paths.src.dirs.stylus, funcs.all);
  return;
});

/**
 * Dev and default tasks
 */
gulp.task('dev', ['watch', 'server'], function() {
  isDev = true;
  jadeData.dev = true;

  funcs.all();
  return;
});

/**
 * Build tasks
 */
gulp.task('build', tasks, function() {
  isDev = false;
});

gulp.task('default', ['dev']);