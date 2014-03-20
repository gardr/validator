var pathLib = require('path');

function resolve(url) {
    var args = [__dirname].concat(url.split('/'));
    var result = pathLib.join.apply(null, args);
    return pathLib.resolve(result);
}

module.exports = {
    headers: {
        'Cache-Control': 'no-cache',
        'Accept-Encoding': 'identify'
    },
    width: 980,
    height: 225,
    parentUrl: resolve('resources/parent.html'),
    iframeUrl: resolve('resources/iframe.html'),
    pageRunTime: 12000,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25'
};
