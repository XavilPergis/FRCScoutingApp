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

// name: String,
// number: Number,
// comments: [String],

var categories = [{
    id: 'auto_highGoalsScored',
    name: 'High Goals Scored',
    mode: 'auto',
    val: 0
}, {
    id: 'auto_highGoalsMissed',
    name: 'High Goals Missed',
    mode: 'auto',
    val: 0
}, {
    id: 'auto_lowGoalsScored',
    name: 'Low Goals Scored',
    mode: 'auto',
    val: 0
}, {
    id: 'auto_lowGoalsMissed',
    name: 'Low Goals Missed',
    mode: 'auto',
    val: 0
}, {
    id: 'auto_roughTerrain',
    name: 'Rough Terrain',
    mode: 'auto',
    val: 0
}, {
    id: 'auto_moat',
    name: 'Moat',
    mode: 'auto',
    val: 0
}, {
    id: 'auto_sallyDoor',
    name: 'Sally Door',
    mode: 'auto',
    val: 0
}, {
    id: 'auto_lowBar',
    name: 'Lowbar',
    mode: 'auto',
    val: 0
}, {
    id: 'tele_highGoalsScored',
    name: 'High Goals Scored',
    mode: 'tele',
    val: 0
}, {
    id: 'tele_highGoalsMissed',
    name: 'High Goals Missed',
    mode: 'tele',
    val: 0
}, {
    id: 'tele_lowGoalsScored',
    name: 'Low Goals Scored',
    mode: 'tele',
    val: 0
}, {
    id: 'tele_lowGoalsMissed',
    name: 'Low Goals Missed',
    mode: 'tele',
    val: 0
}, {
    id: 'tele_roughTerrain',
    name: 'Rough Terrain',
    mode: 'tele',
    val: 0
}, {
    id: 'tele_moat',
    name: 'Moat',
    mode: 'tele',
    val: 0
}, {
    id: 'tele_sallyDoor',
    name: 'Sally Door',
    mode: 'tele',
    val: 0
}, {
    id: 'tele_lowBar',
    name: 'Lowbar',
    mode: 'tele',
    val: 0
}];

let fapi = globals.env['FRC_API'];
let timetable = {};
let teamlist = [];

var scheduleRef = {};

// MATCH LENGTH IS 150 SECONDS
// Team.getAllTeams((tl) => {
//     teamlist = tl;
// });

fapi.schedule({
    eventCode: globals.env['EVENT_CODE'],
    tournamentLevel: 'qual'
}, (data) => {
    // console.log(data);
    scheduleRef = data;
    let _teamtable = {};
    for(let val of data.Schedule) {
        timetable[val.matchNumber.toString()] = new Date(val.startTime);
        for(let _val of val.Teams)
            _teamtable[_val.teamNumber.toString()] = true;
    }
    for(let v in _teamtable) if(_teamtable.hasOwnProperty(v)) {
        fapi.teamListing({ teamNumber: v }, (tdata) => {
            teamlist.push(new Team(tdata.teams[0].teamNumber, tdata.teams[0].nameShort));
            // console.log(teamlist);
        });
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
                    // Automatically handle closing the request
                    res.end();
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
    res.write(`${sc} ${http.STATUS_CODES[sc]}`);
};

let server = new Server({ port: 8080, log_requests: true }, (serv, err) => {
    if(err) throw err;
    console.log('Listening.');
});

server.route('/api', ['GET'], (req, res) => {
    console.log('API GET');
    res.end('Not Yet Implemented');
});

server.route('/api/data', ['POST'], (req, res) => {
    let jso = {};
    try {
        jso = JSON.parse(req.data);
    } catch(e) {
        httpError(400, req, res);
    }

    writeToDB();
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
            host: opts.host,
            port: opts.port || 3000
        }, () => {
            if(opts.logger_enabled) console.log(`WS\tServer Started on port ${opts.port||3000}`);
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
                if(ws.readyState == ws.OPEN) ws.send(`${chan}${_data}`);
                else console.error('WS\tSOCKET NOT OPEN');
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
                console.log(`WS\tCLOSED\t${code}\t${message}`);
                clearInterval(this._kahl);
                ws._team.free();
            });

            this.on('ka', (parts, ws, raw) => {
                let tn = Number(parts[0]);
                ws._alive = true;
            });
            // Keepalive every ten seconds
            this._kahl = setInterval(() => {
                ws._emit('ka');
                ws._alive = false;
                // Four seconds for a timeout
                setTimeout(() => {
                    if(!ws._alive) {
                        console.log(`WS\tTIMEOUT`);
                        ws.close();
                        clearInterval(this._kahl);
                        ws._team.free();
                        console.log('Freed team ' + ws._team.name);
                    }
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
    let rt = Team.getRandom();
    ws._team = rt;
    ws._emit('team', `${rt.name}::${rt.number}`);
});
wss.on('match', (parts, ws, raw) => {
    // May be a bit buggy due to asyncronisity...
    let foo = getCurrentRound(scheduleRef, timetable);
    ws._emit('match', JSON.stringify(foo));
});
wss.on('categories', (parts, ws) => {
    ws._emit('categories', JSON.stringify(categories));
});
wss.on('value', (parts, ws) => {
    console.log(parts[0], parts[1]);
    if(parts[1] == 'add')
        categories.filter(v => v.id == parts[0])[0].val += 1;
    if(parts[1] == 'rem')
        categories.filter(v => v.id == parts[0])[0].val -= 1;
    console.log(categories);
});

setInterval(() => {
    // Simple session management
    for(let k in sessions) if(sessions[k].valueOf() >= Date.now()) delete sessions[k];
    // for(let v of valQueue) {
    //
    // }
}, 1000);

// setInterval(() => {
//
// }, 10000);

// Track crossings
// Defenses:
//
