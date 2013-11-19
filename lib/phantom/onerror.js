// var errors = (window.top.__errors = window.top.__errors || []);
// (function (oldHandler) {
//     console.log('init onerror handler');

//     window.addEventListener('error', function(evt){
//         errors.push({
//             time: Date.now(),
//             message: evt.message,
//             url: evt.filename,
//             line: evt.lineno,
//             banner: window.banner.name
//         });
//     }, false);

//     // window.onerror = function (message, url, line, column, errorObj) {

//     //     var error;
//     //     try {
//     //         throw new Error('trace');
//     //     } catch (e) {
//     //         error = e;
//     //     }

//     //     var errorObj = {
//     //         type: 'hook/error::window.onerror',
//     //         message: message,
//     //         date: Date.now(),
//     //         _trace: error && error.stackArray,
//     //         _trace2: error && error.stack,
//     //         _trace3: errorObj && errorObj.stackArray,
//     //         _trace4: errorObj && errorObj.stack,
//     //         trace: [{
//     //             sourceURL: url,
//     //             line: line,
//     //             column: column
//     //         }]
//     //     };

//     //     errors.push(errorObj);

//     //     if (typeof oldHandler === 'function') {
//     //         oldHandler.apply(this, Array.prototype.slice.call(arguments));
//     //     }
//     //     return true;

//     // };
// })(window.onerror);