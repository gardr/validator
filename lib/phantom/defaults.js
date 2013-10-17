module.exports = {
    parentUrl: 'lib/phantom/resources/parent.html',
    managerScriptPath: 'node_modules/pasties-js/target/pasties-js/js/pasties/mobile.min.js',
    iframeUrl: 'node_modules/pasties-js/target/pasties-js/html/pasties/mobile.htm',
    managerInitPath: 'lib/phantom/resources/manager.js',
    fallbackScriptUrl: 'lib/phantom/resources/inframe.js',
    headers: {
        'Cache-Control': 'no-cache',
        'Accept-Encoding': 'identify'
    },
    width: 980,
    height: 225,
    pageRunTime: 10000,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 \
    (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25'
};
