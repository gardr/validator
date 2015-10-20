var SAME_ACTION_URL_THRESHOLD_MS = 500 ;

module.exports = {
    dependencies: ['actions'],
    preprocess: function (harvested, output, next/*, runtimeConfig*/) {

        var actions = harvested.actions;
        //var iframeUrl = runtimeConfig.iframeUrl;

        // factory
        function createFilter() {
            var cache = {};
            return function filterFn(entry) {
                entry.count = 1;
                if (!cache[entry.url]) {
                    cache[entry.url] = entry;
                    return true;
                }

                var entryTime = entry.time || entry.timestamp;
                var cachetime = cache[entry.url].time || cache[entry.url].timestamp;
                if (cachetime) {
                    if ((cachetime - SAME_ACTION_URL_THRESHOLD_MS) < entryTime) {
                        cache[entry.url].count++;
                        return false;
                    }
                }

                return true;
            };
        }

        // filter out illegalNavigations
        actions.illegalNavigations = actions.illegalNavigations.filter(createFilter());

        // filter out internal navigations
        actions.navigations = actions.navigations.filter(createFilter());

        // filter out window.open
        actions.windowOpened = actions.windowOpened.filter(createFilter());

        // normalize anchors ?
        //console.log('harvested.actions', actions);

        next();
    }
};
