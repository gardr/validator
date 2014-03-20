var KEY = '__tests';

function onHalfTime(api) {
    api.set('actionTime', +new Date());
    api.switchToIframe();
    api.injectLocalJs('./../../node_modules/mock-phantom-touch-events/lib/index.js');
    api.evaluate(function (key) {

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

        try {
            // window.touchActionSequence(
            //     document.getElementById('GARDR').getElementsByTagName('div')[0],
            //     [85, 80],
            //     [400, 45],
            //     750,
            //     50,
            //     collectEvents('testSwipe')
            // );

            var gardrElem = document.getElementById('GARDR');
            if (gardrElem !== null) {
                var elem = gardrElem.querySelector('div[onclick],div');

                window.swipeTop(
                    elem,
                    250,
                    20,
                    collectEvents('swipeTop')
                );
                setTimeout(function () {
                    window.swipeRight(
                        elem,
                        250,
                        20,
                        collectEvents('swipeRight')
                    );

                    setTimeout(function () {
                        window.swipeLeft(
                            elem,
                            250,
                            20,
                            collectEvents('swipeLeft')
                        );
                    }, 1800);
                }, 1800);
            }

        } catch (e) {
            console.log('Failed swiping', e, e.message, e.stack);
        }
    }, KEY);
}

function onBeforeExit(api) {
    var probed = api.evaluate(function (key) {
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
