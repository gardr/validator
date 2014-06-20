var pathLib = require('path');

function resolve(url) {
    var args = [__dirname, '..', 'lib', 'phantom'].concat(url.split('/'));
    var result = pathLib.join.apply(null, args);
    return pathLib.resolve(result);
}

var validatorConfig = require('./validatorConfig.js');

module.exports = {
    parentUrl: resolve('resources/parent.html'),
    iframeUrl: resolve('resources/built/iframe.html'),


    validatorBase: null,

    instrument: [
        // 'errors', // common
        // 'har', // common
        // 'log',
        // 'actions',
        // 'css',
        // 'script',
        // 'screenshots',
        // 'timers',
        // 'jquery',
        // 'gardr',
        // 'touch'
    ],
    preprocess: [
        'screenshots',
        'har'
    ],
    validate : [
        'common',
        'log' ,
        'css' ,
        'timers',
        'jquery',
        'gardr',
        'sizes',
        'codeUsage',
        'touch',
        'security'
    ],


    // config for hooks etc, namespace for convenience.
    config: validatorConfig,

    viewport: {
        width: 980,
        height: 225
    },

    width: {
        min: 980,
        max: 980
    },
    height: {
        min: 225,
        max: 225
    },

    // used for requests - fetching new resources
    headers: {
        'Cache-Control': 'no-cache',
        'Accept-Encoding': 'identify'
    },
    pageRunTime: 12000,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25'
};
