module.exports = {
    'onBeforeExit': function(api){
        api.set('spooky', 'wooky');
        api.set('contextName', api.name);
    }
};
