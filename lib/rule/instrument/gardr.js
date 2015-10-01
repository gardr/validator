function instrumentGardrCollectCSS(config) {
    var NON_WRAPPER_ELEMENTS = [
        'html',
        'head',
        'title', 'link', 'meta', 'style', 'base',
        'body',
        'script', 'noscript', 'template',
        'pre', 'code',
        'audio'
    ];
    function findFirstWrapper(rootElem){
        var el = rootElem;
        if (!el || !el.children || el.children.length === 0){
            return el;
        }
        var len = el.children && el.children.length;

        var cursor;
        for(var i = 0; i < len; i++){
            cursor = rootElem.children[i];
            if (cursor && NON_WRAPPER_ELEMENTS.indexOf(cursor.tagName.toLowerCase()) === -1 ){
                el = cursor;
                break;
            }
        }
        return el;
    }

    var KEYS = ['height', 'width', 'position', 'left', 'right', 'top', 'bottom', 'z-index', 'display', 'visability'];
    function getCss(computedStyle){
        var res = {};
        KEYS.forEach(function (key) {
            if (key && computedStyle && computedStyle.getPropertyValue){
                res[key] = computedStyle.getPropertyValue(key);
            }
        });
        return res;
    }
    function getStyles(el){
        return getCss(window.getComputedStyle(el));
    }

    var output = {};
    // wrapper element
    var element = document.getElementById('gardr');

    if (!element){
        console.log('!internal instrument/gardr.js DEBUG MISSING ELEMENT instrument gardr.js'+document.body.innerHTML+'');
    }


    output.wrapper = {
        'css': getStyles(element),
        'id': element && element.id,
        'clickHandler': getClickHandler(element)
    };


    output.banner = {
        'css': {}
    };

    var el = findFirstWrapper(element);

    if (el !== null) {
        output.banner.__recordedEvents = window.__recordedEvents;
        output.banner.found = true;
        output.banner.clickHandler = getClickHandler(el);
        output.banner.name = el.tagName;
        output.banner.id = el.id;
        output.banner.html = el.innerHTML;
        output.banner.css  = getStyles(el);
        output.banner['data-wrap-id'] = el.getAttribute && el.getAttribute('data-wrap-id');
    } else {
        console.log('!internal instrument/gardr.js not found output.banner');
        output.banner.found = false;
        output.banner.html = element && element.innerHTML;
    }

    function getClickHandler(el){
        return (el && el.onclick && el.onclick.toString())||'';
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
            'html': html,
            'selector': selector
        };
    }

    if (config && config.illegalTags){
        output.illegal = [config.illegalTags].filter(filterFound).map(report);
    }
    return output;
}

function gardrData() {
    if (!window.__manager) {
        console.log('!internal instrument/gardr.js cannot find manager on window');
        return { missingManager: true };
    }
    var item = window.__manager._get('phantom')[0];
    return {
        'frameInput': item.getData(),
        'rendered': item.rendered
    };
}

module.exports = {
    'onPageOpen': function onPageOpen(api/*, config*/) {
        var options = api.getOptions();

        api.evaluate(function injectOptionsToGardrManager(options) {
            try {
                window.initManager(options);
            } catch(e) {
                console.log('!internal - Manager missing!');
            }
        }, JSON.stringify(options));

        api.trigger('onCustomEvent', {name: 'gardrInit'});

        api.set('config', {
            'url': options.scriptUrl,
            'height': options.viewport && options.viewport.height,
            'width': options.viewport && options.viewport.width
        });


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
