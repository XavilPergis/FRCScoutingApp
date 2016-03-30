'use strict';

const        fs = require('fs');
const        ws = require('ws');
const       exc = require('./exception');
const      mime = require('mime-types');
const      uuid = require('uuid');
const      path = require('path');
const      http = require('http');
const     teams = require('./teams');
const    cookie = require('cookie');
const sensitive = require('./sensitive');

const IllegalArgumentException = exc.IllegalArgumentException;

var sessions = {};
var teamlist = [];

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
     * @param {string} url - When to use the callback.
     * @param {string[]} methods - The HTTP methods that can invoke the route.
     * @param {httpCallback} callback - The function to be called when a user accesses the specified url.<br>
     * @param {force=} force - Force The route to be added. This WILL cause unexpected behaviour.
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
    let uri = __dirname + '/client' + req.url;

    // Any other request not handled goes here.
    // Basically a static fileserver
    fs.stat(uri, (err, stat) => {
        if(err) httpError(404, req, res);
        if(stat) {
            if(stat.isDirectory()) uri += 'index.html';
            fs.readFile(uri, (err, buf) => {
                if(err) httpError(404, req, res);
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

let wss = new ws.Server({ host: 'localhost', port: '3000' }, () => {
    console.log('WS\tServer Started');
});

wss.on('connection', ws => {
    ws.on('message', (msg, raw) => {
        // Get the first bit of the message. This will be what the message means
        let chan = msg.split('::')[0];
        let parts = msg.split('::').slice(1);
        let fullmsg = parts.join('::');
        console.log(`WS\t${chan}\t[ ${parts.join(', ')} ]`);
        switch(chan) {
            case 'auth':
                // Time-based uuid generator. Less secure, but does it really matter?
                var ssid = uuid.v1();
                // Get the UTC string for 24 hours in the future.
                // This is when our session cookie will expire.
                var sexp = new Date(new Date().setHours(new Date().getHours() + 24)).toUTCString();
                if(sensitive.server_password === fullmsg) {
                    sessions[ssid] = new Date(sexp);
                    ws.send(`auth::${ssid}::${sexp}`);
                } else ws.send('auth::null');
                break;
            case 'ping':
                ws.send('ping::ack');
                break;
            case 'team':
                if(parts[0] === 'get') {
                    ws.send('team::jdsgljgsdlgjkdasjfkjadkjg');
                }
                break;
            default:
                console.log('WS\tUnknown message from client.');
        }
    });
});
