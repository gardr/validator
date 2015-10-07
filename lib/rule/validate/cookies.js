module.exports = {
    dependencies: ['cookies'],
    preprocessors: [],
    validate: function validate(harvested, report, next/*, globalOptions*/) {

        report.setChecklist('Browser cookies', 'adds overhead');
        var cookies = harvested.cookies.cookies;

        if (cookies && cookies.length > 0) {
            report.info('Detected ' + cookies.length + ' cookie' +
                (cookies.length > 1 ? 's' : '') +
                ' being set after run',
                {list: cookies.map(function(cookie){
                /*  {
                  "domain": "127.0.0.1",
                  "httponly": false,
                  "name": "asd",
                  "path": "/preview/built/",
                  "secure": false,
                  "value": "asd2"
                }
                */
                return cookie.path + ' (' + cookie.domain + '): ' + cookie.name + ' = ' + cookie.value;
            })});
        }

        report.exitChecklist();

        next();
    }
};
