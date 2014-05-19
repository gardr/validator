var KEY = '__tests';

function onHalfTime(api, config) {
    api.set('actionTime', +new Date());
    api.switchToIframe();
    api.injectLocalJs('./../../node_modules/mock-phantom-touch-events/lib/index.js');
    api.evaluate(function instrumentTouchActionHandler(key, config) {
        function collectEvents(subKey) {
            return function (synteticEvent) {
                window[key] = window[key] || {};
                window[key][subKey] = window[key][subKey] || {};
                window[key][subKey][synteticEvent.type] = window[key][subKey][synteticEvent.type] || [];
                var o = {
                    't': +new Date(),
                    'x': synteticEvent.pageX,
                    'y': synteticEvent.pageY,
                    // we keep the event so we can collect/instrument before closing down page
                    '__event': synteticEvent
                };
                window[key][subKey][synteticEvent.type].push(o);
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
            doNext(gardrContainer.querySelector('div[onclick],div'));
        } catch (e) {
            console.log('instrument/touch.js, Failed swiping', e, e.message, e.stack);
        }
    }, KEY, config);
}

function onBeforeExit(api/*, config*/) {

    var probed = api.evaluate(function instrumentTouchProbeHandler(key) {
        if (!window[key]) {
            return {
                noTouchEventsFound: true
            };
        }
        Object.keys(window[key]).forEach(function (_key) {
            Object.keys(window[key][_key]).forEach(function (_method) {
                window[key][_key][_method].forEach(function (e) {
                    e.returnValue = e.__event.returnValue;
                    e.defaultPrevented = e.__event.defaultPrevented;
                    // cleanup event
                    delete e.__event;
                });
            });
        });
        return {
            tests: window[key]
        };
    }, KEY);
    api.set('touchEventData', (probed && probed.tests || {}));
}

module.exports = {
    'onHalfTime': onHalfTime,
    'onBeforeExit': onBeforeExit
};
