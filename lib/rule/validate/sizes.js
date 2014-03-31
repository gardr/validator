/* */
var pathLib = require('path');

var internals = {};

internals.getTraceOfTypes = function (obj) {
    return {
        trace: Object.keys(obj).map(function (str) {
            return {
                'sourceURL': str
            };
        })
    };
};

internals.validEntries = function (data, entry) {
    var _data = data[entry.select];
    return _data && _data.total && _data.total.requests > 0;
};

var RE_LAST_URL_SECTION = /([^\/]+)\/?$/i;
var RE_QUERY = /\?.*$/;
internals.getName = function (str) {
    var output;
    if (typeof str !== 'string') {
        return str;
    }
    str = str.trim().replace(RE_QUERY, '');

    output = pathLib.basename(str);

    if (!output) {
        var m = str.match(RE_LAST_URL_SECTION);
        if (m && m[1]) {
            output = m[1];
        }
    }

    if (!output) {
        output = pathLib.dirname(str);
    }

    return !output ? str : output;
};

internals.formatRaw = function (o) {
    if (!o) {
        return;
    }
    var ignoreKeys = ['base64Content'];
    return Object.keys(o).map(  function (key) {
        var raw = o[key];
        var output = {};
        Object.keys(raw).filter(function (key) {
            if (ignoreKeys.indexOf(key) === -1) {
                output[key] = raw[key];
            }
        });
        var title = internals.getName(output.url);
        output.title = title && title.substring(0, 30);
        return output;
    });
};

internals.outputEntries = function (data, entry) {
    var _data = data.summary[entry.select];
    var raw = internals.formatRaw(data.types[entry.select]);
    return {
        'title': _data.total.requests + ' ' + entry.name[0] + (_data.total.requests > 1 ? entry.name[1] : ''),
        'data': _data.total,
        'raw': raw,
        'hasRaw': raw && raw.length > 0
    };
};

//increaseThreshold

internals.getSummaryView = function (typed) {
    return [{
        'name': ['Script', 's'],
        'select': 'script'
    }, {
        'name': ['CSS', ' files'],
        'select': 'style'
    }, {
        'name': ['Image', 's'],
        'select': 'image'
    }, {
        'name': ['Other / Undefined', ' files'],
        'select': 'other'
    }, {
        'name': ['Requesterror', 's'],
        'select': 'errors'
    }]
    .filter(internals.validEntries.bind(null, typed.summary))
    .map(internals.outputEntries.bind(null, typed));
};

internals.filterUserEntry = function (entry) {
    return entry.sourceURL.indexOf('user-entry.js') === -1;
};

internals.outputSummary = function (summary, report) {

    var totalSummaryView;

    if (summary.typed && summary.typed.summary) {
        totalSummaryView = internals.getSummaryView(summary.typed);
    }

    report.meta(summary.total.rawRequests + ' Requests', {
        'decrease': summary.total.size,
        'hasSummary': totalSummaryView && totalSummaryView.length > 0,
        'summary': totalSummaryView
    });

    if (summary.total.size === 0 || summary.total.size < this.minimumPayloadSize) {
        report.error('Total payload size (' + summary.total.size + ') is zero or close to zero to be able to serve a valid banner/displayad.');
    }

    if (summary.typed && summary.typed.types && summary.typed.types.script) {
        var scripts = internals.getTraceOfTypes(summary.typed.types.script);
        var scriptsLength = scripts.trace.filter(internals.filterUserEntry).length;
        if (scriptsLength > this.maxRequests.script) {
            report.warn('Please do not use (' + scriptsLength +
                ') more than maximum ' + this.maxRequests.script + ' external javascript files', scripts);
        }
    }

    if (summary.typed && summary.typed.types && summary.typed.types.style) {
        var styles = internals.getTraceOfTypes(summary.typed.types.style);
        if (styles.trace.length > this.maxRequests.style) {
            report.error('Please do not use (' + styles.trace.length +
                ') more than maximum 0 external CSS files', styles);
        }
    }

    if (summary.total.requestErrors > this.maxRequests.errors) {
        report.error('There are ' + summary.total.requestErrors + ' request error' +
            (summary.total.requestErrors > 1 ? 's' : ''),
            internals.getTraceOfTypes(summary.typed.types.errors));
    }
};

internals.outputOnSize = function (summary, report /*, options*/ ) {
    var metas = report.getResult().meta;
    var collected = metas.reduce(internals.collectTotalMeta, {
        'total': 0,
        'threshold': 0
    });

    report.meta('Total' + (collected.total > 0 ? ' rest value' : ' over threshold'), {
        'restValue': collected.total,
        'threshold': collected.threshold,
        'success': collected.total >= 0,
        'error': collected.total < 0
    });

    if (collected.total < 0) {
        report.error('Total payload size ' + Math.abs(collected.total) + ' bytes over the threshold, ' + collected.threshold + ' bytes is the maximum size');
    } else {
        report.info('Total payload size ' + summary.total.size + ' is verified and within the limit of ' + collected.threshold + '.');
    }
};

internals.collectTotalMeta = function (totalObj, value) {
    if (value.data) {
        if (value.data.increaseThreshold) {
            totalObj.total += value.data.increaseThreshold;
            totalObj.threshold += value.data.increaseThreshold;
        } else if (value.data.decrease) {
            totalObj.total -= value.data.decrease;
        }
    }
    return totalObj;
};

var RE_ADFORM = /(Adform\.Bootstrap|Adform\.RMB|Adform\.DHTML|EngagementTracker)/i;
internals.outputAdformThreshold = function (rawFileDataSummary, report /*, options*/ ) {
    if (!rawFileDataSummary || !rawFileDataSummary.typed || !rawFileDataSummary.typed.types || !rawFileDataSummary.typed.types.script) {
        return;
    }

    var size = 0;
    var data = rawFileDataSummary.typed.types.script;
    Object.keys(data).forEach(function (scriptUrlKey) {
        if (RE_ADFORM.test(scriptUrlKey)) {
            size += data[scriptUrlKey].bodyLength;
        }
    });

    if (size) {
        report.meta('Adform', { 'increaseThreshold': size });
    }
};

internals.validate = function (harvested, report, next, globalOptions) {

    var baseDesc = 'Base';
    if (globalOptions && globalOptions.format){
        baseDesc += ' for \"' + globalOptions.format.id + '\"';
    }
    report.meta(baseDesc, { 'increaseThreshold': this.thresholdBytes});

    if (this.giveExtraThreshold.jQuery === true && !! (harvested.jquery && harvested.jquery.version)) {
        report.meta('jQuery', {
            'increaseThreshold': this.giveExtraThreshold.jQueryThreshold
        });
    }

    var summary = harvested.har.rawFileDataSummary;
    if (summary) {
        if (this.giveExtraThreshold.AdForm) {
            internals.outputAdformThreshold.call(this, summary, report, globalOptions);
        }
        internals.outputSummary.call(this, summary, report, globalOptions);
        internals.outputOnSize.call(this, summary, report, globalOptions);
    } else {
        report.error('Something went wrong validating sizes. Missing har file data summary.');
    }
    next();
};

module.exports = {
    dependencies: ['har', 'jquery'],
    validate: function (harvested, report, next /*, globalOptions*/ ) {
        if (harvested) {
            internals.validate.apply(this, Array.prototype.slice.call(arguments));
        } else {
            next();
        }
    }
};
