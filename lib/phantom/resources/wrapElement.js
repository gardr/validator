

var internals = {};

internals.addHandlerToString = function (element, eventType, handler, id) {
    var str = handler && handler.toString();
    console.log('!internal resources/wrappedlement.js => toStringedHandler len:' +str.length);
    window.__recordedEvents[eventType] = window.__recordedEvents[eventType]||{};
    window.__recordedEvents[eventType][id] = {
        time: new Date(),
        events: [],
        handler: str,
        elementData: {
            'className': element.className,
            'id': element.id
        }
    };
};

internals.wrap = function (eventType, handler, id) {
    window.__recordedEvents = window.__recordedEvents||{};
    return function (e) {
        window.__recordedEvents[eventType][id].events.push({
            'eventType': eventType,
            'id': id,
            'time': new Date()
        });
        console.log('!internal resources/wrapElement.js => captured ' + eventType, e.target);
        return handler.apply(this, Array.prototype.slice.call(arguments));
    };
};

internals.counter = 0;
internals.getId = function getId(event){
    internals.counter++;
    return [event,
        Date.now(), Math.round(Math.random() + Math.random() +
        Date.now() * Math.random()), internals.counter].join('-');
};

module.exports = function (typesToRegister) {
    if (!typesToRegister){
        throw new Error('Missing array with eventTypes to wrap');
    } else {
        console.log('!internal resources/wrapElement.js => Element.prototype.addEventListener wrapped');
    }
    var _addEventListener = window.Element.prototype.addEventListener;
    window.Element.prototype.addEventListener = function (event, handler, capture) {
        var id = internals.getId(event);
        if (typesToRegister && typesToRegister.indexOf(event) > -1){
            window.__recordedEvents = window.__recordedEvents||{};
            this.setAttribute('data-wrap-id', id);
            console.log('!internal resources/wrapElement.js => window.addEventListener init on ', event);
            internals.addHandlerToString(this, event, handler, id);
            handler = internals.wrap(event, handler, id);
        }

        if (_addEventListener) {
            return _addEventListener.call(this, event, handler, capture);
        }
    };
};
