function instrumentActionsPerformUserInteraction(config) {

    function action(element, type) {
        if (element === null) {
            return;
        }
        // console.log('instrument/actions.js triggering', type, 'on element: ', element.tagName, 'classname:', element.className);
        var event = document.createEvent('MouseEvent');
        event.initMouseEvent(
            type,
            true /* bubble */ ,
            true /* cancelable */ ,
            window,
            null,
            0, 0, 0, 0, /* coordinates screenX, screenY, clientX, clientY */
            false, false, false, false, /* modifier keys */
            0 /*button:left*/ , null
        );
        element.dispatchEvent(event);
    }

    var root = document.body;

    if (!root){
        console.log('!internal instrument/actions.js missing root', root);
    }
    var banner = root.querySelector('div[data-responsive],div[onclick],div,a');

    if (!banner) {
        banner = root.firstElementChild;
    }

    if (!banner) {
        return 'Missing element';
    }

    if (config.trigger.mouseover){
        action(banner, 'mouseover');
    }
    if (config.trigger.click){
        setTimeout(function(){
            action(banner, 'click');
        }, 100);
    }

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

function instrumentActionsCollectWindowOpen() {
    return window.__windowOpenCallers;
}

module.exports = {
    'onHalfTime': function (api, config) {
        api.set('actionTime', +new Date());
        api.switchToIframe();
        if (config.trackWindowOpen){
            api.evaluate(instrumentActionsWrapWindowOpen, config);
        }
        setTimeout(function () {
            api.switchToIframe();
            api.set('actionResult', api.evaluate(instrumentActionsPerformUserInteraction, config));
        }, 50);

    },
    'onBeforeExit': function (api, config) {
        api.switchToIframe();
        if (config.trackWindowOpen){
            api.set('windowOpened', api.evaluate(instrumentActionsCollectWindowOpen, config));
        }
    }
};
