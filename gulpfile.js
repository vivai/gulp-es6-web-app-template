/* eslint-disable no-magic-numbers */

//------------------------------------------------------------------------------
// modules
//
const gulp = require('gulp'),
      sass = require('gulp-sass'),
      source = require('vinyl-source-stream'),
      babelify = require('babelify'),
      watchify = require('watchify'),
      browserify = require('browserify'),
      assign = require('lodash.assign'),
      eslint = require('gulp-eslint'),
      flow = require('gulp-flowtype'),
      del = require('del'),
      path = require('path'),
      karma = require('karma'),
      server = require( 'gulp-develop-server' ),
      util = require('gulp-util'),
      livereload = require('gulp-livereload');

//------------------------------------------------------------------------------
// config
//
const project = './project',
      src = `${project}/src`,
      tests = `${project}/tests`,
      target = `${project}/target`,
      dev = `${project}/dev`,
      paths = {
        src: {
          js: `${src}/js/**/*.js`,
          html: `${src}/html/**/*.html`,
          specs: `${tests}/**/*.spec.js`,
          scss: `${src}/css/**/*.scss`,
          css: `${src}/css/**/*.css`,
          main: {
            js: `${src}/js/main.js`,
            scss: `${src}/css/main.scss`
          }
        },
        lib: {
          js: `${project}/lib/**/*.js`
        },
        target: {
          css: `${target}/www/css`,
          www: `${target}/www`,
          tests: `${target}/tests`,
          specs: `${target}/tests/**/*.spec.js`,
          js: `${target}/www/js`,
          lib: `${target}/www/lib`
        }
      },
      options = {
        // babel: see .babelrc
        browserify: {
          entries: paths.src.main.js,
          debug: true,
          bundle: 'main.js'
        },
        server: {
          path: `${dev}/server.js`,
          args: [
            8000,           // port
            `${target}/www` // docuemnt root
          ]
        },
        flow: { },
        karma: {
          configFile: path.join(__dirname, 'karma.conf.js')
        }
      };

//------------------------------------------------------------------------------
// dump
//
gulp.task('dump', dumpAll);
function dumpAll(done) {
  console.log(dump({paths}));
  console.log(dump({options}));
  done();
}


//------------------------------------------------------------------------------
// utils
//
function isArray(x) { return (!!x) && (x.constructor === Array); }
function isObject(x) { return (!!x) && (x.constructor === Object); }

function clear(done) {
  process.stdout.write('\u001b[2J\u001b[0;0H');
  if(done) done();
}

function onError(config) {
  if (!config) config = {};
  if (!config.emit) config.emit = 'end';

  return function(error) {
    var output = error.name + ' in plugin ' + error.plugin;
    if ( config.type !== 'short') {
      output += '\n' + error.message;
    }
    util.log(util.colors.red(output));
    this.emit(config.emit);
  }
}

function dump(item, deep) {
  var output = '';
  deep = !deep ? 0 : deep;
  const indent = ' '.repeat(deep*2);

  if (isObject(item)) {
    for (var key in item) {
      var value = item[key];
      if (isObject(value)) {
        output += `${indent}${key}: {\n${dump(value,deep + 1)}${indent}}\n`;
      } else if (isArray(value)) {
        output += `${indent}${key}: [\n${dump(value, deep + 1)}\n${indent}]\n`;
      } else {
        output += `${indent}${key}: ${value}\n`;
      }
    }
  } else if (isArray(item)) {
    return indent + item.join(`,\n${indent}`);
  }

  return output;
}

//------------------------------------------------------------------------------
// dump
//
gulp.task('dump:paths', dumpPaths);
function dumpPaths(done) {
  for (var key in paths) {
    var value = paths[key];
    util.log(`paths.${key}: ${value}`);
  }
  done();
}

//------------------------------------------------------------------------------
// check
//
gulp.task('check:eslint', checkEslint);
function checkEslint() {
  return gulp.src(paths.src.js)
    .pipe(eslint())
    .pipe(eslint.format());
    // .pipe(eslint.formatEach('compact', process.stderr));
    // .pipe(eslint.failAfterError())
}

gulp.task('check:flow', checkFlow);
function checkFlow() {
  return gulp.src(paths.src.js)
    .pipe(flow(options.flow));
}

//------------------------------------------------------------------------------
// server
//
gulp.task('start:server', startServer);
function startServer(done) {
  server.listen(options.server, function() {
    livereload.listen({
      quiet: false,
      basePath: paths.target.html});
  });
  done();
}

//------------------------------------------------------------------------------
// build
//
gulp.task('build:sass', buildSass);
function buildSass() {
  return gulp.src(paths.src.main.scss)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.target.css))
    .pipe(livereload());
}

gulp.task('build:js', buildJs({watchify:false}));
gulp.task('watch:js', buildJs({watchify:true}));
function buildJs(config) {
  var bundler;
  var _browserify = browserify(assign({}, watchify.args, options.browserify));
  _browserify.transform(babelify);

  var bundle = function() {
    if (config.watchify) clear();
    return bundler.bundle()
      .pipe(source(options.browserify.bundle))
      .pipe(gulp.dest(paths.target.js));
  }

  if (config.watchify) {
    bundler = watchify(_browserify);
    bundler.on('update', bundle);
  } else {
    bundler = _browserify;
  }

  bundler
    .on('error', onError())
    .on('log', util.log)

  return bundle;
}


//------------------------------------------------------------------------------
// test
//
// run tets with karma
gulp.task('run:tests', gulp.series(runTestsKarma));
function runTestsKarma(done) {
  new karma.Server({
    configFile: options.karma.configFile,
    singleRun: true
  }, done).start();
}

//------------------------------------------------------------------------------
// copy
//
gulp.task('copy:html', copyHtml);
function copyHtml() {
  return gulp.src(paths.src.html)
    .pipe(gulp.dest(paths.target.www))
    .pipe(livereload());
}

gulp.task('copy:css', copyCss);
function copyCss() {
  return gulp.src(paths.src.css)
    .pipe(gulp.dest(paths.target.css))
    .pipe(livereload());
}

gulp.task('copy:lib', copyLib);
function copyLib() {
  return gulp.src(paths.lib.js)
    .pipe(gulp.dest(paths.target.lib))
    .pipe(livereload());
}

gulp.task('copy', gulp.parallel('copy:html', 'copy:css', 'copy:lib'));

//------------------------------------------------------------------------------
// watch
//
gulp.task('watch', gulp.parallel(watch, buildJs({watchify:true})));
function watch(done) {
  gulp.watch(paths.src.html, copyHtml);
  gulp.watch(paths.src.css, copyCss);
  gulp.watch(paths.src.scss, buildSass);
  gulp.watch(paths.lib.js, copyLib);
  done();
}

//------------------------------------------------------------------------------
// main tasks
//
gulp.task(clean);
function clean() {
  return del(target);
}

gulp.task('build',
  gulp.series( clean,
    gulp.parallel('copy', 'build:sass', 'build:js')
  )
);

gulp.task('check', gulp.series(checkEslint, checkFlow));

gulp.task('run', gulp.series( checkEslint, 'build', 'start:server', 'watch'));

gulp.task('default', function(done) {
  util.log('Available tasks: build, check, clean, run, start:server');
  done();
});
