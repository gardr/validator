module.exports = {
    onBeforeExit: function(api) {
        api.set('cookies', api.getCookies());
    }
};
