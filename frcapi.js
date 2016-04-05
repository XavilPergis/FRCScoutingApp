'use strict';
const http = require('http');
const https = require('https');
const querystring = require('querystring');
const request = require('request');
const sensitive = require('./sensitive');
const utils = require('./utils');

// https://frc-api.firstinspires.org/v2.0/$SEASON/

var API = class {
    constructor(opts) {
        if(!opts.username || !opts.auth) {
            throw new Error('Required parameter not supplied!')
        }
        this._username = opts.username;
        this._authkey = (new Buffer(`${opts.username}:${opts.auth}`)).toString('base64');
        this._defaultRequest = {
            host: opts.api_source || 'frc-api.firstinspires.org',
            // port: opts.port || 80,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + this._authkey
            }
        };
        this.season = opts.season;
        // DO NOT CHANGE THIS
        this.version = 'v2.0';
    }
    _request(loc, qso, cb) {
        if(qso) var _qso = qso.filter((key, val) => {
            return !!val;
        });
        let qs = querystring.stringify(_qso);
        if(qs) qs = '?' + qs;
        let req = this._defaultRequest.extend({
            path: `/${this.version}/${this.season}/${loc}${qs}`
        });
        console.log(req);
        https.get(req, (res) => {
            let finalData = new Buffer('');
            res.on('data', (chunk) => {
                finalData = Buffer.concat([finalData, chunk]);
            });
            res.on('end', () => {
                if(res.statusCode === 200) {
                    cb(JSON.parse(finalData.toString()));
                } else throw new Error(finalData);
            });
        });
    }
    alliances(opts, cb) {
        opts.requires(['eventCode']);
        this._request(`alliances/${opts.get('eventCode')}`, null, cb);
    }
    awards(opts, cb) {
        opts = new Options(opts);
        opts.requiresAny(['eventCode', 'teamNumber'])
        let bs = 'awards/';
        if(!!opts.eventCode) bs += opts.get('eventCode').toString() + '/';
        if(!!opts.teamNumber) bs += opts.get('teamNumber').toString() + '/';
        this._request(bs, null, cb);
    }
    awardsList(cb) {
        this._request('awards/list');
    }
    matchResults(opts, cb) {
        opts = new Options(opts);
        opts.requiresIfAny(['tournamentLevel'], ['matchNumber', 'start', 'end']);
        opts.rejectsIfAny(['matchNumber'], ['teamNumber']);
        opts.rejectsIfAny(['start', 'end'], ['matchNumber']);
        this._request(`matches/${opts.get('eventCode')}`, {
            tournamentLevel: opts.get('tournamentLevel'),
            matchNumber: opts.get('matchNumber'),
            teamNumber: opts.get('teamNumber'),
            start: opts.get('start'),
            end: opts.get('end')
        }, cb);

    }
    matchScoreDetails(opts, cb) {
        opts = new Options(opts);
        opts.requires(['eventCode', 'tournamentLevel']);
        this._request(`matches/${opts.get('eventCode')}`, {
            tournamentLevel: opts.get('tournamentLevel')
        }, cb);
    }
    rankings(opts, cb) {
        opts = new Options(opts);
        opts.requires(['eventCode']);
        opts.rejectsIfAny(['teamNumber'], ['top']);
        this._request(`rankings/${opts.get('eventCode')}`, {
            teamNumber: opts.get('teamNumber'),
            top: opts.get('top')
        }, cb);
    }
    schedule(opts, cb) {
        opts = new Options(opts);
        opts.requires(['eventCode']);
        opts.requiresAny(['teamNumber', 'tournamentLevel']);
        this._request(`schedule/${opts.get('eventCode')}`, {
            tournamentLevel: opts.get('tournamentLevel'),
            teamNumber: opts.get('teamNumber'),
            start: opts.get('start'),
            end: opts.get('end')
        }, cb);
    }
    hybrid(opts, cb) {
        opts = new Options(opts);
        opts.requires(['eventCode', 'tournamentLevel']);
        this._request(`schedule/${opts.get('eventCode')}/${opts.get('tournamentLevel')}/hybrid`, {
            teamNumber: opts.get('teamNumber'),
            start: opts.get('start'),
            end: opts.get('end')
        }, cb);
    }
    seasonSummary(cb) {
        opts = new Options(opts);
        this._request('', null, cb);
    }
    eventListing(opts, cb) {
        opts = new Options(opts);
        this._request('events', {
            eventCode: opts.get('eventCode'),
            teamNumber: opts.get('teamNumber'),
            districtCode: opts.get('districtCode'),
            excludeDistrict: opts.get('excludeDistrict'),
        }, cb);
    }
    districtListing(cb) {
        this._request('districts', null, cb);
    }
    teamListing(opts, cb) {
        opts = new Options(opts);
        this._request('teams', {
            teamNumber: opts.get('teamNumber'),
            eventCode: opts.get('eventCode'),
            districtCode: opts.get('districtCode'),
            page: opts.get('page'),
        }, cb);
    }
}

class Options {
    constructor(obj) {
        this.opts = obj || {};
    }
    get(prop) {
        return this.opts[prop.toString()] || null;
    }
    requires(req) {
        let fl = req.filter((el, idx) => {
            return Object.keys(this.opts).indexOf(el) > -1;
        });
        if(fl.length === 0) throw new Error(`Missing required parameter: ${req}!`);
        return this;
    };

    requiresAny(req) {
        let valid = false;
        req.forEach((el) => {
            if(Object.keys(this.opts).indexOf(el) > -1) valid = true;
        });
        if(!valid) throw new Error(`Missing required parameter: ${req}!`);
        return this;
    };

    requiresIfAny(req, l) {
        l.forEach((el) => {
            if(Object.keys(this.opts).indexOf(el) > -1)
                if(!this.opts[req]) throw new Error(`Missing required parameter: ${req}!`);
        });
        return this;
    };

    rejectsIfAny(rej, l) {
        l.forEach((el) => {
            if(Object.keys(this.opts).indexOf(el) > -1)
                if(this.opts[rej]) throw new Error(`Cannot use parameter: ${rej}!`);
        });
        return this;
    };

    requiresIfAll(req, l) {
        let fl = l.filter((el, idx) => {
            return !(Object.keys(this.opts).indexOf(el) > -1);
        });
        if(!this.opts[req] && fl.length == 0) throw new Error(`Missing required parameters: ${req}!`);
        return this;
    };

    rejectsIfAll(rej, l) {
        let fl = l.filter((el, idx) => {
            return !(Object.keys(this.opts).indexOf(el) > -1);
        });
        if(this.opts[rej] && fl.length == 0) throw new Error(`Cannot use parameter: ${rej}!`);
        return this;
    };
}

// var foo = new API({ username: sensitive.username, auth: sensitive.password, season: 2016 });
// foo.rankings({
//     eventCode: 'PAWCH',
//
// }, (data) => {
//     console.log(data);
// });

module.exports = API;
