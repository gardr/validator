
var internals = {};

var allowedToPreventKeys = ['swipeLeft', 'swipeRight'];
var notAllowedToSwipe = ['swipeTop', 'swipeBottom'];

internals.verify = function (touchEvents, mapper){
    return Object.keys(touchEvents).some(function(touchEventType){
        var events = touchEvents[touchEventType];
        return events && events.some(mapper);
    });
};

internals.validate = function (harvested, report, next/*, globalOptions*/) {

    if (!(harvested.touch)) {
        return next();
    }

    var data = harvested.touch && harvested.touch.touchEventData;
    var detectedLegalUsage = false;
    var detectedWrongUsage = false;
    if (data){
        Object.keys(data).forEach(function(swipeKey){
            var result;
            if (allowedToPreventKeys.indexOf(swipeKey) > -1){
                result = internals.verify(data[swipeKey], function(entry){
                    return (entry.defaultPrevented === true);
                });
                if (result === true){
                    detectedLegalUsage = true;
                }
            } else if (notAllowedToSwipe.indexOf(swipeKey) > -1){
                result = internals.verify(data[swipeKey], function(entry){
                    return (entry.defaultPrevented === true || entry.returnValue === false);
                });
                if (result === true){
                    detectedWrongUsage = true;
                    report.error('Detected illegal swipe usage. Please only use horizontal touch events +/- 30%');
                }
            }
        });
    } else {
        report.debug('Validator error. Missing harvested touchevent data');
    }

    if (detectedLegalUsage && detectedWrongUsage !== true){
        report.info('Detected swipe events inside code');
    }


    next();
};

module.exports = {
    dependencies: ['touch'],
    validate: internals.validate
};
