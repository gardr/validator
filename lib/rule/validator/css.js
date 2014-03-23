var parseCSS = require('css-parse');

function formatCssStyle(v) {
    return '  ' + v.property + ': ' + v.value + '; \n';
}

function getCode(rule) {
    return rule.selectors.join(', ') + ' {\n' + rule.declarations.map(formatCssStyle).join('') + '}\n';
}

// only margin and padding is allowed
function declartionVialoation(declarations){
    return declarations.some(function(value){
        if (value.type === 'declaration'){
            // usages of other than margin and padding
            if (!(value.property.indexOf('margin') === 0 || value.property.indexOf('padding') === 0)){
                return true;
            }
        }
    });
}

var RE_VALID_FIRST_SELECTOR = /^[#|\.]{1}/;
function hasSelectorViolation(rule) {
    return rule && rule.selectors && !rule.selectors[0].match(RE_VALID_FIRST_SELECTOR) && declartionVialoation(rule.declarations);
}


function reportErrorOnStyleContent(report, globalOptions) {
    return function (styleContent) {

        var parsed;

        try{
            parsed = parseCSS(styleContent);
        } catch(e){
            return report.info('CSS/Styling might be malformed: '+e.message);
        }

        if (!parsed || !parsed.stylesheet || !parsed.stylesheet.rules) {
            return;
        }
        parsed.stylesheet.rules.filter(function (rule) {
            if (hasSelectorViolation(rule)) {

                report[globalOptions.config.css.strictRules ? 'error' : 'warn']('Styling from style-tag without class or ID prefix found: \"' + rule.selectors.join(', ') + '\"', {
                    'code': getCode(rule)
                });
            }
        });
    };
}

function validateRules(harvested, report, next, globalOptions) {
    // console.log(globalOptions);
    var handler = reportErrorOnStyleContent(report, globalOptions);

    if (harvested.css && Array.isArray(harvested.css.styles)) {
        harvested.css.styles.forEach(handler);
    }
    next();
}

module.exports = {
    dependencies: ['css'],
    validate: function (harvested, report, next, globalOptions) {

        if (harvested) {
            validateRules(harvested, report, next, globalOptions);
        } else {
            next();
        }
    }
};
