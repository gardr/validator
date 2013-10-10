module.exports = function createApi(phantom, page, result){
    //result.calls = 0;
    return {
        evaluate: function(){
            //result.calls++;
            page.evaluate.apply(this, Array.prototype.slice.call(arguments));
        },
        wrap: function(){
            //result.calls++;
            // ?
        },
        getResultObject: function(){
            //result.calls++;
            //result.gottenBy = result.gottenBy||[];
            //result.gottenBy.push('getResultObject');
            return result;
        }
    };
};
