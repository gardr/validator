module.exports = function(grunt){

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        },
        watch: {
          files: ['src/**/*.js', 'test/**/*.js'],
          tasks: ['mochaTest']
        },
    });

    grunt.registerTask('default', 'mochaTest');

};