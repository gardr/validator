require('es5-shim');
var gardrExt = require('gardr-ext');
console.log('built/ext.js -> start');

try{
    gardrExt.plugin(function(gardr) {
        gardr.on('params:parsed', function (params) {
            console.log('built/ext.js -> params event '+JSON.stringify(params, null, 4));
        });

        gardr.on('element:containercreated', function (c) {
            console.log('built/ext.js -> container');
            console.log('built/ext.js, tagName'+c.tagName+':'+c.innerHTML);
        });
    });

    gardrExt({
        allowedDomains: ['localhost', '127.0.0.1', 'validator.gardr.org']
    });
}catch(e){
    console.log(('built/ext.js -> ERROR'+ JSON.stringify(e, null, 4)));
}


console.log('built/ext.js -> EOF');
