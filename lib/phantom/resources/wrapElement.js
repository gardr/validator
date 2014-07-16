window.__recordedEvents = window.__recordedEvents||{};

var internals = {};

/*
    Kan vi kanskje bruke denne til å trappe click events bedre?
*/
var KEYS = ['height', 'width', 'position', 'left', 'right', 'top', 'bottom', 'z-index', 'display', 'visability'];
function getCss(computedStyle){
    var res = {};
    KEYS.forEach(function (key) {
        res[key] = computedStyle.getPropertyValue(key);
    });
    return res;
}
function getStyles(el){
    return getCss(window.getComputedStyle(el));
}


internals.addHandlerToString = function (element, eventType, handler, id) {
    var str = handler && handler.toString();
    console.log('resources/wrapElement.js => toStringedHandler len:' +str.length);
    window.__recordedEvents[eventType] = window.__recordedEvents[eventType] || {};
    window.__recordedEvents[eventType][id] = {
        events: [],
        handler: str,
        elementData: {
            className: element.className,
            id: element.id,
            style: element.style,
            styles: getStyles(element)
        }
    };
};

internals.wrap = function (eventType, handler, id) {
    return function (e) {
        window.__recordedEvents[eventType][id].events.push({
            'eventType': eventType,
            'id': id,
            'time': new Date()
        });
        console.log('resources/wrapElement.js => captured ' + eventType, e.target);
        return handler.apply(this, Array.prototype.slice.call(arguments));
    };
};

internals.counter = 0;
internals.getId = function getId(event){
    return [event,
        Date.now(), Math.round(Math.random() + Math.random() +
        Date.now() * Math.random()), internals.counter++].joins('-');
};

module.exports = function (/*fn*/) {
    console.log('resources/wrapElement.js => Element.prototype.addEventListener wrapped');
    internals._addEventListener = window.Element.prototype.addEventListener;
    window.Element.prototype.addEventListener = function (event, handler, capture) {
        console.log('resources/wrapElement.js => window.addEventListener init on ', event);
        var id = internals.getId(event);
        internals.addHandlerToString(this, event, handler, id);
        handler = internals.wrap(event, handler, id);
        // if (fn) {
        //     fn(this, event, handler);
        // }
        if (internals._addEventListener) {
            return internals._addEventListener.call(this, event, handler, capture);
        }
    };
};
