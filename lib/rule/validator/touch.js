var allowedToPreventKeys = ['swipeLeft', 'swipeRight'];
var notAllowedToSwipe = ['swipeTop', 'swipeBottom'];

function verify(touchEvents, mapper){
    return Object.keys(touchEvents).some(function(touchEventType){
        var events = touchEvents[touchEventType];
        return events && events.some(mapper);
    });
}

function validate(harvested, report, next/*, globalOptions*/) {

    if (!(harvested.touch)) {
        return next();
    }

    var data = harvested.touch.touchEventData;
    var detectedLegalUsage = false;
    var detectedWrongUsage = false;
    Object.keys(data).forEach(function(swipeKey){
        var result;
        if (allowedToPreventKeys.indexOf(swipeKey) > -1){
            result = verify(data[swipeKey], function(entry){
                return (entry.defaultPrevented === true);
            });
            if (result === true){
                detectedLegalUsage = true;
            }
        } else if (notAllowedToSwipe.indexOf(swipeKey) > -1){
            result = verify(data[swipeKey], function(entry){
                return (entry.defaultPrevented === true || entry.returnValue === false);
            });
            if (result === true){
                detectedWrongUsage = true;
                report.error('Detected illegal swipe usage. Please only use horizontal touch events +/- 30%');
            }
        }

    });

    if (detectedLegalUsage && detectedWrongUsage !== true){
        report.info('Detected swipe events inside code');
    }


    next();
}

module.exports = {
    dependencies: ['touch'],
    validate: validate
};
