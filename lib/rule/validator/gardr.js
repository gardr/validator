function validateWrapper(wrapper, report/*, globalOptions*/) {
    if (wrapper.css.position !== 'static' || wrapper.css.visability !== '') {
        report.error('Do not style outside bannercontainer, wrapper element has received som styling');
    }
}

function validateBannerCSS(banner, data, report, opt) {
    var gardrSize = data ? ('Gardr reported size width ' + data.frameOutput.width + ' x height ' + data.frameOutput.height) : '';

    if (banner.found === false) {
        report.warn('Bannercontainer not found / identified. ' + gardrSize);
        return;
    }

    if (banner.name) {
        var css = banner.css;

        report.info('Bannercontainer found / identified, size width ' +
            css.width + ' x height ' + css.height + '. ' + gardrSize);

        validateWidthAndHeight(css, opt, report);

        if (opt.config.gardr.enforceStyling === true) {
            if (css.display !== 'block') {
                report.error('Bannercontainer should use display:block. Currently it is ' + css.display);
            }

            if (css.position !== 'static') {
                report.error('Bannercontainer should have position: "static", but instead it has position: "' +
                    css.position + '". Please use a inner container if position "relative" or "absolute" is needed.');
            }
        }
    }
}

function validateWidthAndHeight(css, opt, report) {
    var numHeight = parseInt(css.height, 10);

    if (!(numHeight >= opt.height.min && numHeight <= opt.height.max)) {
        report.error(
            'Bannercontainer height needs to be between ' +
            opt.height.min + 'px and ' + opt.height.max +
            'px high. Currently it is ' + css.height);
    }

    // should be viewport width
    var numWidth = parseInt(css.width, 10);
    if (opt.width.min === opt.width.max) {
        if (opt.width.min === '100%' && numWidth !== opt.viewport.width) {
            // lets fetch viewport size
            report.error(
                'Bannercontainer width should use 100%(' + opt.viewport.width +
                ') width. Currently it is ' + css.width
            );
        } else if (numWidth !== opt.width.max) {
            report.error(
                'Bannercontainer should use' + opt.width.max +
                ' px width. Currently it is ' + css.width
            );
        }
    } else {
        // within?
        if (!(numWidth >= opt.width.min && numWidth >= opt.width.min)) {
            report.error(
                'Bannercontainer width needs to be between ' +
                opt.width.min + 'px and ' + opt.width.max +
                'px high. Currently it is ' + css.width
            );
        }

    }
}

function findWindowOpenError(list) {
    return list.filter(function (entry) {
        return entry.target !== 'new_window';
    });
}

function windowOpenErrors(list, report) {
    var errors = findWindowOpenError(list);
    if (errors && errors.length > 0) {
        var message = 'Window open called with wrong target, check url' + errors[0].url + ' and target ' + errors[0].target;
        report.error(message, {
            trace: errors.map(function (entry) {
                return entry.trace;
            })
        });
    }
    return errors.length === 0;
}

var RE_WINDOW_OPEN = /.*(window\.open\()+(.*)(new_window)+/gmi;

function validateBannerDom(banner, data, windowOpened, report, options) {
    if (banner.found === false) {
        return;
    }
    if (options.config.gardr.iframeNotAllowed === true &&
        banner.html && banner.html.indexOf('<iframe') > -1) {
        report.warn('Please do not use iframes inside iframe, gardr iframe is your sandbox.');
    }

    if (options.config.gardr.enforceSpec === true) {
        if (windowOpened && windowOpened.length > 0) {
            var noErrorsFound = windowOpenErrors(windowOpened, report);
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
}

function valdiateTags(illegal, report) {
    if (illegal && illegal.length > 0) {
        report.warn('Found illegal tags/usages', {
            list: illegal.map(function (v) {
                return v.html.join(',\n');
            })
        });
    }
}

function validateRules(harvested, report, next, globalOptions) {

    var gardr = harvested.gardr;
    var actions = harvested.actions;
    if (gardr && gardr.dom) {
        var dom = gardr.dom;
        validateWrapper(dom.wrapper, report, globalOptions);
        validateBannerCSS(dom.banner, gardr.data, report, globalOptions);
        validateBannerDom(dom.banner, gardr.data, (actions && actions.windowOpened), report, globalOptions);
        if (globalOptions.config.gardr.illegalTags) {
            valdiateTags(dom.illegal, report);
        }

    }

    next();
}

module.exports = {
    dependencies: ['actions', 'gardr'],
    validate: function (harvested, report, next, options) {
        if (harvested) {
            validateRules(harvested, report, next, options);
        } else {
            next();
        }
    }
};
