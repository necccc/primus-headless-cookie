# primus-headless-cookie

A monkey-patch around http for headless Primus.createSocket to handle sticky sessions & cookies. Result of [issue #452 at primus](https://github.com/primus/primus/issues/452)

## Usage

```
var Primus = require('primus');
var primusHsCookies = require('primus-headless-cookie');

var Socket = Primus.createSocket({ transformer: transformer, parser: parser }),
    url = primusHsCookies('http://localhost:8080'),
    client = new Socket(url);
 ```

## How

It basically adds a unique ID to every url used in sockets, based on this ID, it keeps a register to read Set-Cookie headers and put them back to each outgoing request.
This workaround solves the problem with loadbalancers, like haproxy, which commonly uses cookies for sticky sessions.