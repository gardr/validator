var argv = require('optimist')
            .demand('url')
            .alias('url', 'u')
            .argv;
var runner = require('./runner');

console.log('Validating with input:', argv.url);

console.log('Thank you, come again!');
