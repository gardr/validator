// var buster = require('referee');
// var assert = buster.assert;
// var refute = buster.refute;

// describe('createHar', function () {

//     it('should create a har setup based on requests', function () {
//         var createHAR = require('../../lib/phantom/createHAR.js');
//         var requestFixture = require('./fixtures/request.js');

//         var options = {
//             address: 'http://about:blank',
//             title: 'some title',
//             startTime: new Date(),
//             endTime: new Date(),
//             creator: {
//                 name: 'test',
//                 version: '0.0.1'
//             }
//         };

//         var entries = [];

//         var report = createHAR(options, entries);

//         assert.isObject(report);
//         assert.equals(report.log.entries.length, entries.length);

//         entries = [requestFixture, requestFixture, requestFixture, requestFixture];
//         report = createHAR(options, entries);
//         assert.equals(report.log.entries.length, entries.length);
//     });

// });
