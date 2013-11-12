module.exports = {
    'onBeforeExit': function(api){
        api.getResultObject().hooky = 'wooky';
    },
    'validate': function(harvested, report, next){
        // todo add some
        next();
    }
};
