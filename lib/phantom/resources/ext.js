require('es5-shim');

var gardrExt = require('gardr-ext');

function log(){
    console.log.apply(console, ['built/ext.js'].concat(Array.prototype.slice.call(arguments)));
}

log('built/ext.js -> start');

try{
    gardrExt.plugin(function(gardr) {
        gardr.on('params:parsed', function (params) {
            log('-> params event '+JSON.stringify(params, null, 4));
        });

        gardr.on('element:containercreated', function (c) {
            log('-> container');
            log('tagName'+c.tagName+':'+c.innerHTML);
        });
    });

    gardrExt({
        allowedDomains: ['localhost', '127.0.0.1', 'validator.gardr.org']
    });
}catch(e){
    log(('-> ERROR:'+ JSON.stringify(e, null, 4)));
}

log('built/ext.js -> EOF');
