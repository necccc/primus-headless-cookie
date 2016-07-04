'use strict'

const URL = require('url');
const http = require('http');
const shimmer = require('shimmer');
const querystring = require('querystring');

var cookies = {};

var getSwarmId = function (path) {
    return path.match(/_SWARMID=([a-zA-Z0-9\-_]*)&/)[1];
}

var createSwarmId = function () {
    return Math.floor((Math.random() * 1000000000)).toString(16) + Math.floor((Math.random() * 1000000000)).toString(16);
}

var setCookieIterator = function (swarmId, cookie) {

    let key = cookie.split('=')[0];
    let value = cookie.split('=')[1];
    let keys = [];

    if (cookies[swarmId].length > 0) {
        cookies[swarmId].map(function (c) {
            if (c) keys.push(c.split('=')[0])
        });
    }

    if (keys.indexOf(key) < 0) {
        cookies[swarmId].push(cookie);
    } else {
        cookies[swarmId] = cookies[swarmId].map(function (c) {
            let k = c.split('=')[0];

            if (key === k) {
                return key + '=' + value;
            } else {
                return c;
            }
        });
    }
}

/*
    monkey-patch http request, so we make primus 'handle and save' cookies
 */
var fakeRequest = function (originalHttpRequest) {

    return function wrappedRequest (requestParams, cb) {

        let swarmId = getSwarmId(requestParams.path);

        if (cookies[swarmId]) {
            requestParams.headers['Cookie'] = cookies[swarmId].join('; ');
        } else {
            cookies[swarmId] = [];
        }

        let callback = function (origcb) {
            return function (response) {
                let swarmId = getSwarmId(response.req.path);

                if (response.headers['set-cookie']) {
                    response.headers['set-cookie'].join('; ').split('; ').map(setCookieIterator.bind(null, swarmId));
                }
                if (origcb) origcb.apply(this, arguments)
            }
        };
        return originalHttpRequest.apply(this, [requestParams, callback(cb)])
    }
}

shimmer.wrap(http, 'request', function (original) {
    return fakeRequest(original)
});

module.exports = function (url) {
    let sid = createSwarmId(),
        primusUrl = URL.parse(url),
        query = querystring.parse(primusUrl.query);

    query['_SWARMID'] = createSwarmId();
    primusUrl.search = '?' + querystring.stringify(query);
    return URL.format(primusUrl);
}