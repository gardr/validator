var pagespeed = require('gpagespeed');

var State = require('gardr-host/lib/state.js');

function getHashes(options){
    var state = new State(options && options.name||'pagespeed', options);
    return state.getData();
}

function getOptions(conf){

    var hash = getHashes({
        'url': conf.url,
        'width': conf.width||0,
        'height': conf.height||0
    });

    hash = encodeURIComponent(JSON.stringify(hash));

    return {
        'url': this.serveDomain + this.serveIframeUrl + '?ts=' + Date.now() + '#' + hash,
        'key': this.apiKey
    };

}

function pagespeedPreprocessor(harvested, output, next) {
    if (this && !this.runGooglePagespeed){
        return next();
    }

    if (!harvested.gardr || !harvested.gardr.config){
        console.warn('Missing gardr data/config for pagespeed request');
        return next();
    }

    var options = getOptions.call(this, harvested.gardr.config);

    pagespeed(options, pageSpeedResultHandler);

    function pageSpeedResultHandler(err, data){
        if (!err && data){
            try{
                data = JSON.parse(data);
                if (data.error){
                    err = data.error;
                } else {
                    output('result', data);
                }
            } catch(e){
                err = e;
            }
        }

        if (err && process.env.NODE_ENV !== 'test'){
            console.log('preprocess/pagespeed error', err);
        }
        next();
    }
}

module.exports = {
    dependencies: ['gardr'],
    output: 'pagespeed',
    preprocess: pagespeedPreprocessor
};
