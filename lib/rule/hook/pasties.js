module.exports = {
    'onPageOpen': function onPageOpen(api){

        var settings = api.getOptions();
        var options = JSON.stringify(settings);
            /*
                Todo:

                1) inject manager
                2) inject manager init-script (order-issues)
                3) init with options (add scriptUrl, iframeUrl)
            */
        api.injectLocalJs(settings.managerScriptPath);
        api.injectLocalJs(settings.managerInitPath);

        api.evaluate(function(options){
            console.log('Pasties Loading in: '+!!window.initManager);
            window.initManager(options);
        }, options);



    }
};
