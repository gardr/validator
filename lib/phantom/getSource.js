module.exports = function (error) {
    if (!error){
        try {
            throw new Error('Usage violation');
        } catch (e) {
            error = e;
        }
    }
    if (error) {
        //return error.stackArray;
        var last = error.stackArray[error.stackArray.length-1];
        return last.sourceURL + ':' + last.line;
    }
    return '';
};
