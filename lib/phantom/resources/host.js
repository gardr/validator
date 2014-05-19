require('es5-shim');

if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            NOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof NOP && oThis
                                     ? this
                                     : oThis,
                                   aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        NOP.prototype = this.prototype;
        fBound.prototype = new NOP();

        return fBound;
    };
}

var gardrHost = require('gardr-host');
console.log('built/host.js manager init fn:', gardrHost);

window.initManager = function (options) {
    options = JSON.parse(options);

    if (!options.scriptUrl){
        throw new Error('Missing scriptUrl from gardr-manager');
    }

    var manager = window.__manager = gardrHost({
        iframeUrl: options.iframeUrl
    });

    console.log('built/host.js manager', manager);

    function getOrigin(loc) {
        return loc.origin || (loc.protocol + '//' + loc.hostname + (loc.port ? ':' + loc.port : ''));
    }

    var base = getOrigin(document.location) + '/';

    manager.extendInframeData({
        loglevel: 4,
        logto: 'console',
        // base to help test local version e.g. test fixtures
        base: base //,
        //scriptUrl: params.url
    });

    console.log('built/host.js QUEUED:', options.scriptUrl);


    var bannerName = 'phantom';

    manager.queue(bannerName, {
        'url': options.scriptUrl,
        'container': 'ADS',
        'height': options.viewport.height,
        'width': options.viewport.width
    });

    manager.renderAll(function (err, result) {
        if (err){
            console.log(('built/host.js renderAll() -> ERROR: '+JSON.stringify(err)));
        } else {
            try{
                var item = manager._get(bannerName)[0];
                console.log('built/host.js Found item:', item, !!item);

                result = JSON.stringify({
                    'name': 'phantom',
                    'state': item.state,
                    'lastState': item.lastState,
                    // accessing iframe via gardr ref
                    'content': item.iframe.element.contentWindow.document.body.innerHTML
                });
            }catch(e){
                result = e;

                console.log(
                    'built/host.js (manager-data-extraction) ERROR result:'+e+
                    e.stack
                );
            }
        }

    });
};
