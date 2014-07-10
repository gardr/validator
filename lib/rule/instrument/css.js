module.exports = {
    'onBeforeExit': function (api, config) {
        function instrumentCSSGetStyles(config) {
            var filterOut = [
                config.filterOutStyleTagsWith
            ];

            function filterOutGardr(v) {
                return !!v && filterOut.indexOf(v.trim()) === -1 && v.toUpperCase().indexOf('GARDR') === -1;
            }

            function mapContent(tag) {
                return tag.innerHTML;
            }

            var styleTags = Array.prototype.slice.call(document.querySelectorAll('style'));

            return styleTags.map(mapContent).filter(filterOutGardr);
        }

        api.switchToIframe();
        api.set('styles', api.evaluate(instrumentCSSGetStyles, config));
    }
};
