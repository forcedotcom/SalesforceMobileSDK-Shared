'use strict';

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    require('time-grunt')(grunt);

    grunt.initConfig({
        bower: {
            install: {
                options: {
                    targetDir: 'dependencies',
                    cleanTargetDir: true
                }
            }
        }
    });

    grunt.registerTask('default', ['bower']);
};
