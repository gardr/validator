require('es5-shim');
var gardrHost = require('gardr-host');

function log(){
    console.log.apply(console, ['!internal built/host.js'].concat(Array.prototype.slice.call(arguments)));
}

log('manager init fn:', gardrHost);

window.initManager = function(options) {
    options = JSON.parse(options);

    if (!options.scriptUrl) {
        throw new Error('Missing scriptUrl from gardr-manager');
    }

    var manager = window.__manager = gardrHost({
        iframeUrl: options.iframeUrl
    });

    log('manager', manager);

    function getOrigin(loc) {
        return loc.origin || (loc.protocol + '//' + loc.hostname + (loc.port ?':' + loc.port : ''));
    }

    var base = getOrigin(document.location) + '/';

    manager.extendInframeData({
        loglevel: 4,
        logto: 'console',
        // base to help test local version e.g. test fixtures
        base: base //,
        //scriptUrl: params.url
    });

    log('QUEUED:', options.scriptUrl);

    var bannerName = '!internal_banner_name';

    manager.queue(bannerName, {
        'url': options.scriptUrl,
        'container': 'ADS',
        'height': options.viewport.height,
        'width': options.viewport.width
    });

    manager.renderAll(function(err, result) {
        if (err) {
            log('renderAll() -> ERROR: ' + JSON.stringify(err));
        } else {
            try {
                var item = manager._get(bannerName)[0];

                result = JSON.stringify({
                    'name': '!internal_banner_name',
                    'state': item.state,
                    'lastState': item.lastState,
                    // accessing iframe via gardr ref
                    'content': item.iframe.element.contentWindow.document.body.innerHTML
                });
                log('Found item:'+result);

            } catch (e) {
                result = e;

                log(
                    '(manager-data-extraction) ERROR result:' +
                    e +
                    e.stack
                );
            }
        }
    });
};

log('EOF');
