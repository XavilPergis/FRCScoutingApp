'use strict';

const        fs = require('fs');
const        ws = require('ws');
const       exc = require('./exception');
const      mime = require('mime-types');
const      uuid = require('uuid');
const      path = require('path');
const      http = require('http');
const      Team = require('./teams');
const     utils = require('./utils');
const    cookie = require('cookie');
const    FRCAPI = require('./frcapi');
const sensitive = require('./sensitive');

const IllegalArgumentException = exc.IllegalArgumentException;

var globals = require('./globals');

globals.env['FRC_API'] = new FRCAPI({ username: sensitive.username, auth: sensitive.password, season: 2016 });
globals.env['EVENT_CODE'] = 'PAWCH';

let fapi = process.env['FRC_API'];
let timetable = {};
let teamlist = [];

var scheduleRef = {};

// MATCH LENGTH IS 150 SECONDS

fapi.schedule({
    eventCode: 'PAWCH',
    tournamentLevel: 'qual'
}, (data) => {
    console.log(data);
    scheduleRef = data;
    let _teamtable = {};
    for(let val of data.Schedule) {
        timetable[val.matchNumber.toString()] = new Date(val.startTime);
        for(let _val of val.Teams)
            _teamtable[_val.teamNumber.toString()] = true;
    }
    for(let v in _teamtable) if(_teamtable.hasOwnProperty(v)) {
        teamlist.push(v);
    }
});

let getCurrentRound = function(sch, tt) {
    let round = -1;
    for(let k in tt) {
        // XXX: DO NOT KEEP THIS DATE STRING!!!
        if(tt[k].valueOf() > new Date('Saturday, 02-Apr-16 14:33:00 UTC')) {
            round = Number(k) - 1;
            break;
        }
    }
    if(round > -1) {
        let m = sch.Schedule.filter(el => el.matchNumber == round)[0];
        return m;
    }
}

var sessions = {};

/**
 * The default callback use in node http servers.
 * @callback httpCallback
 * @param {string} req - The request object.
 * @param {string} res - The response object.
 */

class Server {
    constructor(opts, cb) {

        let PORT = opts.port || process.env.PORT;
        let HOST = opts.host || process.env.HOST;

        this.routes = [];

        this.server = http.createServer((req, res) => {
            if(opts.log_requests) console.log(`${req.method}\t${req.url}`);
            for(let route of this.routes) {
                let valid_method = false;
                for(let m of route.methods) if(m.toUpperCase() == req.method) valid_method = true;
                // Make sure the url specified is at the root
                if(req.url.indexOf(route.url) === 0 && valid_method) {
                    route.callback(req, res);
                    // We found what we want, don't allow anything else
                    break;
                }
            }
        }).on('error', (err) => {
            if(cb) cb(this, err);
        }).on('listening', () => {
            if(cb) cb(this);
        }).listen(PORT, HOST);
    }

    /**
     * Create a route.
     * @flow
     * @param {string} url - When to use the callback.
     * @param {string[]} methods - The HTTP methods that can invoke the route.
     * @param {httpCallback} callback - The function to be called when a user accesses the specified url.<br>
     * @param {boolean=} force - Force The route to be added. This WILL cause unexpected behaviour.
     */
    route(url, methods, callback, force) {
        let valid = true;
        // Only run operation if it's not a forced push
        // if(!force) for(let obj of this.routes) valid = valid && obj.url !== url || obj.methods;
        if(typeof url === 'string' && typeof callback === 'function' && valid) {
            this.routes.push({
                'url': url,
                'methods': methods,
                'callback': callback
            });
        } else throw new IllegalArgumentException('Invalid URL or callback passed into Server.route!');
        return this;
    }

}

const httpError = (sc, req, res) => {
    res.writeHead(sc, {'Content-Type': 'text/plain'});
    res.end(`${sc} ${http.STATUS_CODES[sc]}`);
};

let server = new Server({ port: 8080, log_requests: true }, (serv, err) => {
    if(err) throw err;
    console.log('Listening.');
});

server.route('/api', ['GET'], (req, res) => {
    console.log('API GET');
    res.end('Not Yet Implemented');
});

server.route('/api', ['POST'], (req, res) => {
    console.log('API POST');
    res.end('Not Yet Implemented');
});

server.route('/', ['GET'], (req, res) => {
    let uri = __dirname + req.url;

    // Any other request not handled goes here.
    // Basically a static fileserver
    fs.stat(uri, (err, stat) => {
        if(err) { httpError(404, req, res); return; }
        if(stat) {
            if(stat.isDirectory()) uri += 'index.html';
            fs.readFile(uri, (err, buf) => {
                if(err) { httpError(404, req, res); return; }
                // If we don't know the MIME type, assume it is 'text/plain'
                let mt = mime.lookup(path.extname(uri)) || 'text/plain';
                let headerObj = {
                    'Content-Type': mt
                };
                res.writeHead(200, headerObj);
                res.write(buf);
                res.end();
            });
        }
    });
});

// let wss = new ws.Server({ host: 'localhost', port: '3000' }, () => {
//     console.log('WS\tServer Started');
// });

// Very similar to Server! Might be able to fix.
class WebSocketServer {
    constructor(opts, wss) {
        this.opts = opts;
        this.ehl = [];

        // SERVER INIT ---------------------------------------------------------
        // Create a server if none is provided
        if(!wss) wss = new ws.Server({
            host: opts.host || 'localhost',
            port: opts.port || '3000'
        }, () => {
            if(opts.logger_enabled) console.log('WS\tServer Started');
        });

        // SERVER PROTOTYPES ---------------------------------------------------
        wss.broadcast = function(data) {
            wss.clients.forEach((cli) => {
                cli.send(data);
            });
        };

        wss.on('connection', (ws) => {
            // CLIENT PROTOTYPES -----------------------------------------------
            ws._emit = function(chan, data) {
                let _data = data ? `::${data}` : '::__NODATA';
                if(opts.logger_enabled) console.log(`WS <--\t${chan}\t${data}`);
                ws.send(`${chan}${_data}`);
            }

            ws._lastKeepAlive = -1;

            ws.on('message', (msg, raw) => {
                let chan = msg.split('::')[0];
                let parts = msg.split('::').slice(1);
                if(opts.logger_enabled) console.log(`WS -->\t${chan}\t[ ${parts.join(', ')} ]`);
                for(let ch of this.ehl) if(ch.name === chan)
                    ch.cb(parts, ws, raw);
            });
            ws.on('close', (code, message) => {
                console.log(code, message);
            });

            this.on('ka', (parts, ws, raw) => {
                let tn = Number(parts[0]);
            });
            // Keepalive every ten seconds
            setInterval(() => {
                ws._emit('ka');
                ws._lastKeepAlive = Date.now();
                // Four seconds for a timeout
                setTimeout(() => {

                }, 4000);
            }, 10000);
        });
    }
    on(name, cb) {
        this.ehl.push({ name: name, cb: cb });
    }
}

let wss = new WebSocketServer({ logger_enabled: true });

// Each call to `on` will listen for ANY client that sends the message and will
// provide the sender in `ws`

wss.on('auth', (parts, ws, raw) => {
    // Time-based uuid generator. Less secure, but does it really matter?
    var ssid = uuid.v1();
    // Get the UTC string for 24 hours in the future.
    // This is when our session cookie will expire.
    var sexp = new Date(new Date().setHours(new Date().getHours() + 24)).toUTCString();
    if(sensitive.server_password === parts[1]) {
        sessions[ssid] = new Date(sexp);
        ws._emit('auth', `${ssid}::${sexp}`);
    } else ws._emit('auth');
});
wss.on('team', (parts, ws, raw) => {
    ws._emit('team', getRandomTeam());
});
wss.on('match', (parts, ws, raw) => {
    // May be a bit buggy due to asyncronisity...
    let foo = getCurrentRound(scheduleRef, timetable);
    ws._emit('match', JSON.stringify(foo));
});
wss.on('ping', (parts, ws) => {

});

setInterval(() => {
    // Simple session management
    for(let k in sessions) if(sessions[k].valueOf() >= Date.now()) delete sessions[k];
}, 1000);

// Track crossings
// Defenses:
//
