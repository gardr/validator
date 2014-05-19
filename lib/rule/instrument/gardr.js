function instrumentGardrCollectCSS(config) {
    var KEYS = ['height', 'width', 'position', 'left', 'right', 'top', 'bottom', 'z-index', 'display', 'visability'];
    // wrapper element
    var element = document.getElementById('gardr');

    console.log('instrument/gardr.js collecting from element:', element);
    if (!element){
        console.log('instrument/gardr.js DEBUG MISSING ELEMENT instrument gardr.js'+document.body.innerHTML+'');
    }

    var computedStyle = window.getComputedStyle(element);

    var wrapper = {
        'css': {},
        clickHandler: element.onclick && element.onclick.toString()
    };
    KEYS.forEach(function (key) {
        wrapper.css[key] = computedStyle.getPropertyValue(key);
    });

    var banner = {
        'css': {}
    };

    var firstChildElement = element.querySelector('div[data-responsive],div[onclick],a[href]');
    if (firstChildElement === null) {
        firstChildElement = element.querySelector('div');
    }

    if (firstChildElement !== null) {
        banner.found = true;
        banner.clickHandler = firstChildElement.onclick && firstChildElement.onclick.toString();
        banner.name = firstChildElement.tagName;
        banner.html = firstChildElement.innerHTML;
        computedStyle = window.getComputedStyle(firstChildElement);
        KEYS.forEach(function (key) {
            banner.css[key] = computedStyle.getPropertyValue(key);
        });
    } else {
        console.log('instrument/gardr.js not found banner');
        banner.found = false;
        banner.html = element.innerHTML;
    }

    // look for illegal tags
    function filterFound(selector) {
        var found = document.querySelectorAll(selector);
        return found && found.length > 0;
    }

    function report(selector) {
        var html = [];
        var list = Array.prototype.slice.call(document.querySelectorAll(selector));

        list.forEach(function (el) {
            var wrap = document.createElement('div');
            wrap.appendChild(el.cloneNode(true));
            html.push(wrap.innerHTML);
        });

        return {
            html: html,
            selector: selector
        };
    }

    var illegal = [config.illegalTags].filter(filterFound).map(report);

    return {
        'illegal': illegal,
        'wrapper': wrapper,
        'banner': banner
    };
}

function gardrData() {
    if (!window.__manager) {
        console.log('instrument/gardr.js cannot find manager on window');
        return { missingManager: true };
    }
    var item = window.__manager._get('phantom')[0];
    var result = {
        'frameInput': item.getData(),
        'frameOutput': {
            'hidden': item.options.hidden,
            'minSize': item.options.minSize,
            'timeout': item.options.timeout,
            'retries': item.options.retries,
            'container': !!item.options.container,
            'height': item.options.height,
            'width': item.options.width,
            'url': item.options.url

        },//item.options//item.input
        '_debug': Object.keys(item.options)
    };
    console.log('instrument/gardr.js found item', result);
    return result;
}

module.exports = {
    'onPageOpen': function onPageOpen(api/*, config*/) {
        api.evaluate(function (options) {
            window.initManager(options);
        }, JSON.stringify(api.getOptions()));

    },
    'onBeforeExit': function (api, config) {
        // gardr host is in main frame
        api.switchToMainFrame();

        // get Gardr Host/Manager data
        api.set('data', api.evaluate(gardrData, config));
        // inspect iframe dom
        api.switchToIframe();
        api.set('dom', api.evaluate(instrumentGardrCollectCSS, config));
    }
};
