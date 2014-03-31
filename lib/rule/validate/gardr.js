var internals = {};

internals.validateWrapper = function (wrapper, report) {
    if (wrapper.css.position !== 'static' || wrapper.css.visability !== '') {
        report.error('Do not style outside Banner, wrapper element has received som styling');
    }
};

internals.validateBannerCSS = function (banner, data, report, globalOptions) {
    var gardrSize = data ? ('Gardr reported size width ' + data.frameOutput.width + ' x height ' + data.frameOutput.height) : '';

    if (banner.found === false) {
        report.error('Banner not identified. ' + gardrSize);
        return;
    }

    if (banner.name) {
        var css = banner.css;

        report.info('Banner identified, size width ' +
            css.width + ' x height ' + css.height + '. ' + gardrSize);

        internals.validateWidthAndHeight(css, globalOptions, report);

        if (this.enforceStyling === true) {
            if (css.display !== 'block') {
                report.error('Banner should use display:block. Currently it is ' + css.display);
            }

            if (css.position !== 'static') {
                var method = css.position === 'relative' ? 'warn' : 'error';
                report[method]('Banner should have position: "static", but instead it has position: \"' +
                    css.position + '\". Please use a inner container if position "relative" or "absolute" is needed.');
            }
        }
    }
};

internals.validateWidthAndHeight = function (css, opt, report) {
    var numHeight     = parseInt(css.height, 10);
    var numWidth      = parseInt(css.width, 10);

    if (opt.height.max && opt.height.min === opt.height.max){
        if (numHeight !== opt.height.min){
            report.error('Banner height needs to be '+opt.height.min+'px. Currently it is ' + css.height);
        }
    } else if (!(numHeight >= opt.height.min && numHeight <= opt.height.max)) {
        report.error('Banner height needs to be between '+opt.height.min + 'px and ' + opt.height.max +
            'px. Currently it is ' + css.height);
    }


    if (opt.width.max && opt.width.min === opt.width.max) {
        if (opt.width.min === '100%') {
            if (numWidth !== opt.viewport.width){
                report.error(
                    'Banner width should use 100%(' + opt.viewport.width +
                    ') width. Currently it is ' + css.width
                );
            }

        } else if (numWidth !== opt.width.max) {
            report.error(
                'Banner should use ' + opt.width.max +
                ' px width. Currently it is ' + css.width
            );
        } else {
            // ?
        }
    } else if (!(numWidth >= opt.width.min && numWidth >= opt.width.min)) {
        report.error(
            'Banner width needs to be between ' +
            opt.width.min + 'px and ' + opt.width.max +
            'px high. Currently it is ' + css.width
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
        var message = 'Window open called with wrong target, check url' + errors[0].url + ' and target ' + errors[0].target;
        report.error(message, {
            trace: errors.map(function (entry) {
                return entry.trace;
            })
        });
    }
    return errors.length === 0;
};

var RE_WINDOW_OPEN = /.*(window\.open\()+(.*)(new_window)+/gmi;

internals.validateBannerDom = function (banner, data, windowOpened, report) {
    if (banner.found === false) {
        return;
    }
    if (this.iframeNotAllowed === true &&
        banner.html && banner.html.indexOf('<iframe') > -1) {
        report.warn('Please do not use iframes inside iframe, gardr iframe is your sandbox.');
    }

    if (this.enforceSpec === true) {
        if (windowOpened && windowOpened.length > 0) {
            var noErrorsFound = internals.windowOpenErrors(windowOpened, report);
            if (noErrorsFound) {
                // if window open was registered and no errors found, we do not need to check for clickhandler.
                return;
            }
        }

        if (!banner.clickHandler || banner.clickHandler === '') {
            report.error('Missing clickhandler on banner html element/tag ' + banner.name + '.');
        } else if (banner.clickHandler) {
            var matches = banner.clickHandler.match(RE_WINDOW_OPEN);
            if (!matches) {
                report.error('Missing onclick handler on banner wrapper element, and no click registered in simulation.');
            }
        }
    }
};

internals.valdiateTags = function (illegal, report) {
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

    internals.validateWrapper.call(this, gardr.dom.wrapper, report);
    internals.validateBannerCSS.call(this, gardr.dom.banner, gardr.data, report, globalOptions);
    internals.validateBannerDom.call(this, gardr.dom.banner, gardr.data, (actions && actions.windowOpened), report);

    if (this.illegalTags) {
        internals.valdiateTags.call(this, gardr.dom.illegal, report);
    }

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
