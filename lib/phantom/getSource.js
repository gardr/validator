module.exports = function getSource(error) {
    if (!error){
        try {
            throw new Error('Usage violation');
        } catch (e) {
            error = e;
        }
    }
    if (error) {
        if (!error.stackArray){
            throw error;
        }
        return error.stackArray[error.stackArray.length-1];
    }
    return '';
};
