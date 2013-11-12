module.exports = function getSource(error) {
    if (!error){
        try {
            throw new Error('Usage violation');
        } catch (e) {
            error = e;
        }
    }
    if (error) {
        var last = error.stackArray[error.stackArray.length-1];
        return last.sourceURL + ':' + last.line;
    }
    return '';
};
