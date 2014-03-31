var parseCSS = require('css-parse');

var internals = {};

internals.formatCssStyle = function (v) {
    return '  ' + v.property + ': ' + v.value + '; \n';
};

internals.getCode = function (rule) {
    return rule.selectors.join(', ') +
        ' {\n' + rule.declarations.map(internals.formatCssStyle).join('') + '}\n';
};

// only margin and padding is allowed
internals.declartionVialoation = function (declarations) {
    return declarations.some(function (value) {
        if (value.type === 'declaration') {
            // usages of other than margin and padding
            if (!(value.property.indexOf('margin') === 0 || value.property.indexOf('padding') === 0)) {
                return true;
            }
        }
    });
};

var RE_VALID_FIRST_SELECTOR = /^[#|\.]{1}/;

internals.hasSelectorViolation = function (rule) {
    return rule && rule.selectors
        && !rule.selectors[0].match(RE_VALID_FIRST_SELECTOR) &&
        internals.declartionVialoation(rule.declarations);
};

internals.reportErrorOnStyleContent = function (config, report) {
    return function (styleContent) {

        var parsed;

        try {
            parsed = parseCSS(styleContent);
        } catch (e) {
            return report.info('CSS/Styling might be malformed: ' + e.message);
        }

        if (!parsed || !parsed.stylesheet || !parsed.stylesheet.rules) {
            return;
        }
        parsed.stylesheet.rules.forEach(function (rule) {
            if (internals.hasSelectorViolation(rule) === false) {
                return;
            }
            var method = config.strictRules ? 'error' : 'warn';
            report[method]('Styling from style-tag without class or ID prefix found: \"' +
                rule.selectors.join(', ') + '\"', {
                    'code': internals.getCode(rule)
                });

        });
    };
};

internals.validateRules = function (harvested, report, next) {
    if (Array.isArray(harvested.css.styles)) {
        harvested.css.styles.forEach(
            internals.reportErrorOnStyleContent(this, report)
        );
    } else {
        report.debug('Found no styling/styles to inspect');
    }
    next();
};

module.exports = {
    dependencies: ['css'],
    validate: function (harvested, report, next) {
        if (harvested && harvested.css) {
            internals.validateRules.apply(this, Array.prototype.slice.call(arguments));
        } else {
            next();
        }
    }
};
