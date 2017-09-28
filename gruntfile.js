module.exports = function () {
  var grunt = this;

  grunt.initConfig({
    remove: {
      default_options: {
        trace: true,
        dirList: [
          'build',
          'dist',
        ],
      },
    },

    // this is so backwards
    run: {
      coverage: {
        cmd: 'npm',
        args: ['run','coverage','--silent'],
      },
      lint: {
        cmd: 'npm',
        args: ['run','lint','--silent'],
      },
      lintdev: { // allows console/debugger
        cmd: 'npm',
        args: ['run','lintdev','--silent'],
      },
    },

    watch: {
      t: { // run tests when anything changes
        files: [
          'src/**/*.js',
          'tests/**/*.js',
          '../fdlib/src/**/*.spec.js',   // shared sources
          '../fdlib/tests/**/*.spec.js', // shared testing stuff
          '../fdh/tests/**/*.spec.js',   // actual tests
          '../fdv/**/*.js',              // verifier
        ],
        tasks: [
          'testq',
        ],
      },
    },

    mochaTest: {
      all: {
        src: ['tests/specs/**/*.spec.js'],
        options: {
          bail: true,
          require: [
            'babel-core/register',  // translate es6 syntax to es5
            'babel-polyfill',       // babel only translates, doesnt add new libs
          ],
          // it appears that babel supports an option to redirect the rc but no idea here
          // for now it uses a default config inlined into package.json
          //babelrc: 'config/babelrc',
          timeout: 6000,
          reporter: 'spec',
        },
      },
      nobail: {
        src: ['tests/specs/**/*.spec.js'],
        options: {
          require: [
            'babel-core/register',  // translate es6 syntax to es5
            'babel-polyfill',       // babel only translates, doesnt add new libs
          ],
          // it appears that babel supports an option to redirect the rc but no idea here
          // for now it uses a default config inlined into package.json
          //babelrc: 'config/babelrc',
          timeout: 6000,
          reporter: 'spec',
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-run'); // runs npm scripts
  grunt.loadNpmTasks('grunt-remove');

  grunt.registerTask('clean', ['remove']);
  grunt.registerTask('coverage', ['clean', 'run:coverage']);
  grunt.registerTask('test', 'lint then test', ['clean', 'run:lintdev', 'mochaTest:all']);
  grunt.registerTask('testq', 'test without linting', ['clean', 'mochaTest:nobail']);

  grunt.registerTask('default', ['test']);
};
