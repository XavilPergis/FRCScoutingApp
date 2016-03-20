'use strict';

const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const ws = require('ws');

let states = {};
let teams = [484];

let categories = [
    'foo', 'bar', 'baz'
];

// XXX PROTOTYPES XXX
// Array.prototype.randomize = function(arr) {
//     let _arr = [];
//     _arr.push(arr.splice(Math.floor(Math.random() * this.length), 1));
//     return _arr;
// };
// console.log(require('util').inspect(Array, { showHidden: true, depth: null }));

function* counter() {
    let ct = 0;
    while(true) yield ct++;
}

let nid = counter();

function newId() {
    return crypto.createHash('md5').update(nid.next().value.toString()).digest('hex');
}

/*

"teamname": {
    "teleop": {},
    "autonomous": {},
    "special": []
}

*/

let serv = http.createServer((req, res) => {
    if(req.url.indexOf('/api') == 0) {
        // console.log('API');
        if(req.method == 'GET') {
            // Return the scouting data
        } else if(req.method == 'POST') {
            // Post some scouting data
            let pbuf = new Buffer([]);
            req.on('data', data => {
                pbuf = Buffer.concat([pbuf, new Buffer(data)]);
            });
            req.on('end', () => {
                let pstr = pbuf.toString();
                // console.log('END', pstr);
                try {
                    jso = JSON.parse(pstr);
                    // TODO: Make json API
                } catch(e) {
                    res.end('400 Bad Request', 400);
                }
            })
            // console.log('POST', req);
        } else {
            res.end('400 Bad Method', 400);
        }
        res.end('200', 200);
    } if(req.url.indexOf('/keepalive') == 0) {
        res.end('200 OK', 200);
    } else {
        // console.log(__dirname + req.url);
        fs.stat(__dirname + req.url, (err0, stat) => {
            if(err0) {
                // console.error(err0);
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('404 NOT FOUND');
            } else {
                let loc = req.url;
                if(stat.isDirectory()) {
                    loc += 'index.html';
                }
                fs.readFile(__dirname + loc, (err, buf) => {
                    if(err) {
                        // console.error(err);
                        res.writeHead(404, {'Content-Type': 'text/plain'});
                        res.end('404 NOT FOUND')
                    } else {
                        res.write(buf);
                        res.end();
                    }
                    // console.log(res.statusCode + ' GET ' + __dirname + loc);
                });
            }
        });
    }
}).listen(8080);

let wss = new ws.Server({host:'localhost', port:'3000'}, () => {
    console.log('Server Started');
});

wss.on('connection', ws => {
    ws.on('message', (msg, raw) => {
        let parts = msg.split('::');
        let sid = null;
        for(var i = 0; i < parts.length; i++) {
            if(parts[i].split('=')[0] == 'session') {
                sid = parts[i].split('=')[1]
            }
        }
        try {
            let res = {};
            if(!sid) {
                if(parts.indexOf('newid') > -1) {
                    let nid = newId().toString();
                    res.id = nid;
                    // states[nid] = teams.randomize().pop();
                } else if(parts.indexOf('getcategories') > -1) {
                    res.categories = categories;
                } else if(parts.indexOf('team') > -1) {
                    res.team
                }
            // For methods that don't rely on a session ID
            } else {
                if(parts.indexOf('ping') > -1) res.ping = 'accepted';
            }
            console.log(res);
            ws.send(JSON.stringify(res));
        } catch(e) {
            console.log(e);
        }
    });
});
// let foo = [1, 2, 3, 4, 5];
// console.log(foo);
// console.log(typeof foo);
// console.log(require('util').inspect(foo, { showHidden: true, depth: null }));
// console.log(Array.randomize(foo));

// console.log(require('util').inspect(wss, { depth: null }));
