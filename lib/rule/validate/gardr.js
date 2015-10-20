/* jshint maxcomplexity:19*/
var internals = {};

internals.validateWrapper = function (wrapper, report) {
    if (!wrapper || !wrapper.css){
        report.debug('Something went wrong. Gardr validator missing expected input. Code G-001.');
        return;
    }
    if (wrapper.css.position !== 'static' || wrapper.css.visability !== '') {
        report.error('Do not style outside Banner, wrapper element has received som styling');
    }
};

internals.validateBannerCSS = function (banner, data, report, globalOptions) {

    if (!data || !data.rendered){
        report.error('Banner not identified / Something went wrong because "rendered" property is missing.');
        return;
    }

    if (banner.found === false) {
        var extraInfo = '';
        if (data && data.rendered){
            extraInfo += 'Gardr reported size width ' + data.rendered.width + ' x height ' + data.rendered.height;
        }
        report.error('Banner container not identified. ' + extraInfo);
        return;
    }

    // if no name, no gardr banner-data
    if (!banner.name) {
        report.debug('Missing banner data.');
        return;
    }

    var sizes = banner.css;

    if (data.rendered){
        sizes = {
            'width': data.rendered.width,
            'height': data.rendered.height
        };
    }

    report.info('Banner identified, size width ' + sizes.width + ' x height ' + sizes.height + '.');

    internals.validateWidthAndHeight(sizes, globalOptions, report);
    internals.validateStrictBannerCSS.call(this, banner, report);
};

internals.validateStrictBannerCSS = function(banner, report){
    if (this.enforceStyling !== true) {
        report.debug('Strict styling check is turned off.');
        return;
    }
    if (!banner || !banner.css){
        report.debug('Something went wrong. Gardr validator missing expected input. Code G-002.');
        return;
    }
    if (banner.css.display !== 'block') {
        report.error('Banner should use display:block. Currently it is ' + banner.css.display);
    }

    if (banner.css.position !== 'static') {
        var method = banner.css.position === 'relative' ? 'warn' : 'error';
        report[method]('Banner should have position: "static", but instead it has position: \"' +
            banner.css.position + '\". Please use a inner container if position "relative" or "absolute" is needed.');
    }
};

internals.validateWidthAndHeight = function (sizes, opt, report) {
    var numHeight     = parseInt(sizes.height, 10);
    var numWidth      = parseInt(sizes.width, 10);

    if (!numHeight || !numWidth) {
        report.error('Banner sizes could not be calculated');
        return;
    }

    if (opt.height.max && opt.height.min === opt.height.max){
        if (numHeight !== opt.height.min){
            report.error('Banner height needs to be '+opt.height.min+'px. Currently it is ' + sizes.height);
        }
    } else if (!(numHeight >= opt.height.min && numHeight <= opt.height.max)) {
        report.error('Banner height needs to be between '+opt.height.min + 'px and ' + opt.height.max +
            'px. Currently it is ' + sizes.height);
    }


    if (opt.width.max && opt.width.min === opt.width.max) {
        if (opt.width.min === '100%') {
            if (numWidth !== opt.viewport.width){
                report.error(
                    'Banner width should use 100%(' + opt.viewport.width +
                    ') width. Currently it is ' + sizes.width
                );
            }

        } else if (numWidth !== opt.width.max) {
            report.error(
                'Banner should use ' + opt.width.max +
                ' px width. Currently it is ' + sizes.width
            );
        } else {
            // ?
        }
    } else if (!(numWidth >= opt.width.min && numWidth >= opt.width.min)) {
        report.error(
            'Banner width needs to be between ' +
            opt.width.min + 'px and ' + opt.width.max +
            'px high. Currently it is ' + sizes.width
        );
    }
};

internals.findWindowOpenError = function (list) {
    return list.filter(function (entry) {
        return entry.target !== 'new_window';
    });
};

internals.windowOpenErrors = function (list, report) {
    var errors = internals.findWindowOpenError(list);
    if (errors && errors.length > 0) {
        var message = 'Window open called with wrong target, check url \"' +
            errors[0].url +
            '\" and target \"' +
            (errors[0].target || '') +
            '\"';
        report.error(message, {
            trace: errors.map(function (entry) {
                return entry.trace;
            })
        });
    }
    return errors.length === 0;
};


internals.checkNavigations = function (/*list, report*/) {
    // var errors = internals.findWindowOpenError(list);
    // if (errors && errors.length > 0) {
    //     var message = 'Window open called with wrong target, check url' + errors[0].url + ' and target ' + errors[0].target;
    //     report.error(message, {
    //         trace: errors.map(function (entry) {
    //             return entry.trace;
    //         })
    //     });
    // }
    // return errors.length === 0;
    return true;
};


internals.validateIframeInsideIframe = function (banner, report) {
    if (banner.found === false) {
        return;
    }
    if (
        this.iframeNotAllowed === true &&
        (
            (
                banner.html && banner.html.toLowerCase().indexOf('<iframe') > -1
            ) || (
                banner.name && banner.name.toLowerCase() === 'iframe'
            )
        )
    ) {
        report.warn('Please do not use iframes inside iframe, gardr iframe is your sandbox.');
    }
};

var RE_WINDOW_OPEN = /.*(window\.open\()+(.*)(new_window)+/gmi;

internals.validateClick = function (banner, data, actions, report) {
    var validAction = actions.navigations.length > 0 || actions.windowOpened.length > 0;

    if (actions.windowOpened) {
        actions.windowOpened.forEach(function(entry){
            if (actions.actionTime > entry.time) {
                report.error('Window open triggered before click');
            }
        });
    }
    if (actions.navigations) {
        actions.navigations.forEach(function(entry){
            if (actions.actionTime > entry.timestamp) {
                report.error('Navigation triggered before click');
            }
        });
    }



    if (banner.found === false) {
        if (!validAction) {
            report.error('Click / window action error, might be because banner element is missing.');
        }
        return;
    }

    if (Array.isArray(actions.anchors)) {
        var result = actions.anchors.filter(function(anchor){
            if (anchor.target !== '_blank') {
                return true;
            }
        });

        if (actions.anchors.length === 0) {
            // report.info('');
        } else if (result.length > 0) {
            report.error('Anchors should have target set to "_blank"', {list: result.map(function(anchor){
                return anchor.html;
            })});
        }
    }

    if (validAction) {
        var noErrorsFound = internals.windowOpenErrors(actions.windowOpened, report);
        if (noErrorsFound) {
            noErrorsFound = internals.checkNavigations(actions.navigations, report);
        }
        if (noErrorsFound) {
            report.info('Found valid link/target navigation', {
                list:
                actions.navigations.map(function(entry){
                    return entry.type + ' ' + new Date(entry.timestamp) + ': \"' + entry.url + '\"';
                }).concat(
                actions.windowOpened.map(function(entry){
                    return 'window.open() ' + new Date(entry.time) + ': \"' + entry.url + '\" with target "' + entry.target;
                }))
            });
            // if window open was registered and no errors found, we do not need to check for clickhandler.
            return;
        }
    } else {
        report.error('Missing anchor/link or `window.open()` not called');
    }

    //data-wrap-id comes from wrapElement.js via ext.js hookup. TODO make wrapElement.js more apparent.
    var missingHandlers = (!banner.clickHandler || banner.clickHandler === '') &&
                          (!banner['data-wrap-id'] || banner['data-wrap-id'] === '');
    if ( missingHandlers ) {
        report.error('Missing clickhandler on banner html element/tag <' + banner.name + '>.');
    } else if (banner['data-wrap-id'] &&
                banner.__recordedEvents &&
                banner.__recordedEvents.click &&
                banner.__recordedEvents.click[banner['data-wrap-id']]) {
        var entry = banner.__recordedEvents.click[banner['data-wrap-id']];
        var entryMatches = entry.handler.match(RE_WINDOW_OPEN);
        if (!entryMatches) {
            report.error('Clickhandler found via addEventListener, but not correct usage.');
        }
    } else if (banner.clickHandler) {
        var matches = banner.clickHandler.match(RE_WINDOW_OPEN);
        if (!matches) {
            report.error('Clickhandler found on element, but not correct usage.');
        }
    } else {
        report.error('Missing onclick handler on banner wrapper element, and no click registered in simulation.');
    }

};

internals.validateTags = function (illegal, report) {
    if (illegal && illegal.length > 0) {
        report.warn('Found illegal tags/usages', {
            list: illegal.map(function (v) {
                return v.html.join(',\n');
            })
        });
    }
};

internals.validateRules = function (harvested, report, next, globalOptions) {

    var gardr = harvested.gardr;
    var actions = harvested.actions;

    report.setChecklist('Banner element', 'check for styling on banner element');
    internals.validateWrapper.call(this, gardr.dom.wrapper, report);
    internals.validateBannerCSS.call(this, gardr.dom.banner, gardr.data, report, globalOptions);
    internals.validateIframeInsideIframe.call(this, gardr.dom.banner, report);
    report.exitChecklist();

    report.setChecklist('Click action', 'check if click triggers window.open');
    internals.validateClick.call(this, gardr.dom.banner, gardr.data, actions, report);

    if (this.illegalTags) {
        internals.validateTags.call(this, gardr.dom.illegalTags, report);
    }
    report.exitChecklist();

    next();
};

module.exports = {
    dependencies: ['actions', 'gardr'],
    validate: function (harvested, report, next) {
        if (harvested && harvested.gardr && harvested.gardr.dom) {
            internals.validateRules.apply(this, Array.prototype.slice.call(arguments));
        } else {
            next();
        }
    }
};
