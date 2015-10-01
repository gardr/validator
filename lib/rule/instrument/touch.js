var STORAGE_KEY = '__tests';


function instrumentTouchActionHandler(storageKey, config) {

    function collectEvents(subKey) {
        return function (synteticEvent) {
            window[storageKey] = window[storageKey] || {};
            window[storageKey][subKey] = window[storageKey][subKey] || {};
            window[storageKey][subKey][synteticEvent.type] = window[storageKey][subKey][synteticEvent.type] || [];
            var o = {
                't': +new Date(),
                'x': synteticEvent.pageX,
                'y': synteticEvent.pageY,
                // we keep the event so we can collect/instrument before closing down page
                '__event': synteticEvent
            };
            window[storageKey][subKey][synteticEvent.type].push(o);
        };
    }

    var possibleActions = ['swipeTop', 'swipeRight', 'swipeLeft', 'swipeBottom'];
    var actions = possibleActions.filter(function(key){
        return config[key] === true;
    });

    var current = 0;
    function doNext(elem){
        var key = possibleActions[current];
        window[key](elem, config.swipeTime, config.frames, collectEvents(key));
        current++;
        if (current < actions.length){
            setTimeout(function(){ doNext(elem); }, config.delayBeforeNext);
        }
    }

    var gardrContainer;
    try {
        gardrContainer = document.getElementById('gardr');
        if (gardrContainer === null){
            throw new Error('instrument/touch.js, Missing GARDR container');
        }
        var elem = gardrContainer.querySelector('div[onclick],a,div');
        if (elem === null){
            throw new Error('instrument/touch.js, Missing valid element');
        }
        doNext(elem);
    } catch (e) {
        console.log('!internal instrument/touch.js, Failed swiping', e, e.message, e.stack);
    }
}

function instrumentTouchProbeHandler(storageKey) {

    var result = {};

    if (!window[storageKey]) {
        result.noTouchEventsFound = true;
        return result;
    }

    // iterate deep
    Object.keys(window[storageKey]).forEach(function (_key) {
        Object.keys(window[storageKey][_key]).forEach(function (_method) {
            window[storageKey][_key][_method].forEach(getEventData);
        });
    });

    function getEventData(e) {
        e.returnValue = e.__event.returnValue;
        e.defaultPrevented = e.__event.defaultPrevented;
        // cleanup event
        delete e.__event;
    }

    result.tests = window[storageKey];

    return result;
}

function onHalfTime(api, config) {
    api.set('actionTime', +new Date());
    api.switchToIframe();
    api.injectLocalJs('./../../node_modules/mock-phantom-touch-events/lib/index.js');
    api.evaluate(instrumentTouchActionHandler, STORAGE_KEY, config);
}

function onBeforeExit(api/*, config*/) {
    var probed = api.evaluate(instrumentTouchProbeHandler, STORAGE_KEY);
    api.set('touchEventData', (probed && probed.tests || {}));
}

module.exports = {
    'onHalfTime': onHalfTime,
    'onBeforeExit': onBeforeExit
};
