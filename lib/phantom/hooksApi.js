module.exports = function createApi(phantom, page){
    return {
        evaluate: function(){
            page.evaluate.apply(this, Array.prototype.slice.call(arguments));
        },
        wrap: function(){
            // ?
        }
    };
};
