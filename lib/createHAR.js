module.exports = function createHAR(options, input) {
    var address     = options.address;
    var title       = options.title;
    var creator     = options.creator;

    var startTime   = new Date(input.startTime);
    var endTime     = new Date(options.endTime);
    var resources   = input.resources;

    var entries = [];

    resources.forEach(function (resource) {
        var request = resource.request,
            startReply = resource.startReply,
            endReply = resource.startReply;

        if (!request || !startReply || !endReply) {
            return;
        }

        // Exclude Data URI from HAR file because
        // they aren't included in specification
        if (request.url.match(/(^data:image\/.*)/i)) {
            return;
        }

        entries.push({
            startedDateTime: new Date(request.time).toISOString(),
            time: endReply.time - request.time,
            request: {
                method: request.method,
                url: request.url,
                httpVersion: 'HTTP/1.1',
                cookies: [],
                headers: request.headers,
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: endReply.status,
                statusText: endReply.statusText,
                httpVersion: 'HTTP/1.1',
                cookies: [],
                headers: endReply.headers,
                redirectURL: '',
                headersSize: -1,
                bodySize: startReply.bodySize,
                content: {
                    size: startReply.bodySize,
                    mimeType: endReply.contentType
                }
            },
            cache: {},
            timings: {
                blocked: 0,
                dns: -1,
                connect: -1,
                send: 0,
                wait: new Date(startReply.time) - new Date(request.time),
                receive: new Date(endReply.time) - new Date(startReply.time),
                ssl: -1
            },
            pageref: address
        });
    });

    return {
        log: {
            version: '1.2',
            creator: creator,
            browser: {},
            pages: [{
                startedDateTime: startTime.toISOString(),
                id: address,
                title: title,
                pageTimings: {
                    onLoad: endTime - startTime
                }
            }],
            entries: entries,
            comment: ''
        }
    };
};
