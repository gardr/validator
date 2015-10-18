function instrumentActionsPerformUserInteraction(config) {

    function action(element, type) {
        if (element === null) {
            return;
        }
        try {
            var mouseEvent = document.createEvent('MouseEvent');
            mouseEvent.initMouseEvent(
                type,
                true /* bubble */ ,
                true /* cancelable */ ,
                window,
                null,
                0, 0, 0, 0, /* coordinates screenX, screenY, clientX, clientY */
                false, false, false, false, /* modifier keys */
                0 /*button:left*/ , null
            );
            element.dispatchEvent(mouseEvent);
        } catch(e) {
            console.log('!internal instrument/actions.js - failed dispatching mouseEvent' + type);
        }
    }

    function toStringElement(el, indent) {
        if (indent === undefined){
            indent = '';
        }

        var attrs = Object.keys(el.attributes).map(function(i){
            var attr = el.attributes[i];
            if (!attr.name) {
                return '';
            }
            return attr.name + '="' + attr.value + '"';
        }).filter(Boolean).join(' ');


        return  [
            indent + '<',
            el.tagName.toLowerCase(),
            (attrs ? ' ' : ''),
            attrs, '>',
            toStringChildrenElements(el, indent + '  '),
            '\n' + indent + '</',
            el.tagName.toLowerCase(),
            '>'
        ].join('');
    }

    function toStringChildrenElements(el, indent) {
        return Array.prototype.slice.call(el.childNodes).map(function(el){
            if (el.tagName) {
                return '\n' + toStringElement(el, indent);
            } else {
                var content = el.textContent.trim();
                if (content) {
                    return '\n' + indent + content;
                } else {
                    return '';
                }
            }
        }).join('');
    }

    var root = document.body;

    if (!root){
        console.log('!internal instrument/actions.js missing root', root);
    }

    var banner = root.querySelector('div[data-responsive],div[onclick],div,a,iframe');

    if (!banner) {
        banner = root.firstElementChild;
    }

    if (!banner) {
        return 'Missing element';
    }

    if (config.trigger.mouseover){
        action(banner, 'mouseover');
    }

    window.__anchors = [];

    function searchTree(node) {
        if (!node) {
            return;
        }
        if (config.trigger.click){
            action(node, 'click');
        }

        Array.prototype.slice.call(
            node.querySelectorAll('*')
        ).forEach(function(el, index){

            if (el === banner) {
                return;
            }

            if (el.tagName.toLowerCase() === 'a') {
                window.__anchors.push({
                    href: el.href,
                    html: toStringElement(el),
                    target: el.target
                });
            }

            setTimeout(function(){
                if (config.trigger.mouseover){
                    action(el, 'mouseover');
                }
                if (config.trigger.click){
                    action(el, 'click');
                }
            }, index * 10);
        });
    }

    searchTree(banner)

    Array.prototype.slice.call(banner.querySelectorAll('iframe')).forEach(function(el, index){
        searchTree(el.contentDocument.body);
    });

    return true;
}

function instrumentActionsWrapWindowOpen() {
    function getWindowOpenSource() {
        var error;
        try {
            throw new Error('windowOpenTracer');
        } catch (e) {
            error = e;
        }
        if (error && error.stackArray) {
            return error.stackArray[error.stackArray.length - 1];
        }
    }

    window.__windowOpenCallers = [];
    window.open = function (url, target) {
        window.__windowOpenCallers.push({
            url: url,
            target: target,
            time: Date.now(),
            trace: getWindowOpenSource()
        });
    };
}

function instrumentActionsCollectAnchors() {
    return window.__anchors;
}

function instrumentActionsCollectWindowOpen() {
    return window.__windowOpenCallers;
}

var halfTimeTriggered = false;
module.exports = {
    'defaults': function(){
        return {
            navigations: [],
            illegalNavigations: [],
            windowOpened: []
        };
    },
    '_reset': function(){
        halfTimeTriggered = false;
    },
    'onHalfTime': function (api, config, gc) {
        halfTimeTriggered = true;

        api.lockNavigation();
        // api.set('navigations', []);
        // api.set('illegalNavigations', []);
        // api.set('windowOpened', []);
        api.set('actionTime', +new Date());
        api.switchToIframe();

        setTimeout(function () {
            api.switchToIframe();

            var result = api.evaluate(instrumentActionsPerformUserInteraction, config);
            api.set('actionResult', result);

            if (config.trigger.click) {
                // fallback click
                api.sendMouseEvent('click', 10, 10);
            }

        }, 50);

    },
    'onBeforeExit': function (api, config) {
        api.switchToIframe();
        if (config.trackWindowOpen){
            api.set('windowOpened', api.evaluate(instrumentActionsCollectWindowOpen, config));
        }

        api.set('anchors', api.evaluate(instrumentActionsCollectAnchors, config))
    },
    'onNavigationRequested': function(url, type, willNavigate, main, api, config) {
        if (main === true) {
           return true;
        }

        //console.log('|-> onNavigationRequested url:', url, 'type:', type, 'willNavigate:', willNavigate, 'main:', main);

        if (halfTimeTriggered === true) {
            api.setPush('navigations', {
                timestamp: Date.now(),
                url: url,
                type: type,
                willNavigate: willNavigate,
                main: main
            });
            // return false stops navigation
            return false;
        } else {
            if (
                // allowed to create dynamic iframe with about:blank.
                url === 'about:blank' ||
                // allow iframe.htm to pass throught because of willNavigate === true.
                willNavigate === true) {
                return true;
            }

            api.setPush('illegalNavigations', {
                timestamp: Date.now(),
                url: url,
                type: type,
                willNavigate: willNavigate,
                main: main
            });
            return true;
        }
    },
    onCustomEvent: function(payload, api, config) {
        if (payload && payload.name === 'gardrStart') {
            if (config.trackWindowOpen) {
                api.switchToIframe();
                api.evaluate(instrumentActionsWrapWindowOpen, config);
            }
        }
        if (payload && payload.name === 'gardrInit') {
            if (config.trackWindowOpen) {
                api.lockNavigation();
                api.switchToIframe();
            }
        }
    }
};
