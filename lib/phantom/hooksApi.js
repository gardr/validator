module.exports = function createApi(phantom, page, result){
    //result.calls = 0;
    return {
        evaluate: function apiEvaluate(){
            //result.calls++;
            page.evaluate.apply(page, Array.prototype.slice.call(arguments));
        },
        injectLocalJs: function(){
            page.injectJs.apply(page, Array.prototype.slice.call(arguments));
        },
        getOptions: function apiGetOptions(){
            return page.options;
        },
        wrap: function apiWrap(){
            //result.calls++;
            // ?
        },
        getResultObject: function apiGetResultObject(){
            //result.calls++;
            //result.gottenBy = result.gottenBy||[];
            //result.gottenBy.push('getResultObject');
            return result;
        }
    };
};
