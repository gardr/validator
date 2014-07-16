var images = [];
var started = false;

module.exports = {
    'onCustomEvent': function(data, api){
        if (data  && data.name === 'gardrInit'){
            api.set('onCustomEvent', Date.now());
            started = true;
        }
    },
    'onPageOpen': function (api, config) {
        api.set('onPageOpen', Date.now());

        var options = api.getOptions();

        var base = (options.outputDirectory||'phantom_screenshots') + '/' + options.viewport.width + 'x' + options.viewport.height + '_';

        function handler() {
            if (started === true){
                var image = api.getPNG();

                if (config.onlyUnique === true && image !== images[images.length - 1]) {
                    api.renderToFile(base + Date.now() + '.png');
                    images.push(image);
                }
                if (config.onlyUnique !== true) {
                    api.renderToFile(base + Date.now() + '.png');
                }
            }

            // loop
            window.setTimeout(handler, config.ms);
        }


        window.setTimeout(handler, config.ms);
    }
};
