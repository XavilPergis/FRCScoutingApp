'use strict';

let env = {
    'title': 'Scouting App',
    'foo': 0,
    'teamnumber': 484
};

// let state = 'init';

let team = undefined;
let cid = undefined;

var ws = new WebSocket('ws://localhost:3000');
console.log(ws);

function update() {
    let nl = document.getElementsByClassName('content-bind');

    for(let n in nl) {
        let node = nl[n];
        // console.log(node);
        for(let k in node.attributes) {
            if(node.attributes[k].name == 'bind') {
                node.innerHTML = node.innerHTML.replace(/%%/gi, env[node.attributes[k].nodeValue]);
            }
        }
    }
}

let nl = document.getElementsByClassName('bind-update');
for(let n in nl) {
    try {
        nl[n].onclick = e => {
            env['foo']++;
            update();
        };
    } catch(e) {
        console.error(nl[n]);
    }
}

update();

function pushData(data) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api');
    xhr.overrideMimeType('application/json');
    xhr.send(JSON.stringify(data));
}

function getNewId() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/id');
    xhr.send();
}

// function getCookies() {
//     console.log($.cookie('foo'));
// }

document.getElementById('484p').addEventListener('click', e => {
    console.log(document.cookie);
});

ws.onopen = () => {
    ws.send('ping');
};

// ws.send('getcategories');

class StateMachine {
    constructor() {
        this.state = 'init';
        this._stateList = {};
    }
    state(s, cb) {
        this._stateList[s] = cb;
        return this;
    }
    update(res) {
        for(let key of this._stateList) {
            if(this.state == s || s == '*') this._stateList[key](res);
        }
    }
}

let sm = new StateMachine();

sm.state('populate_ready', (res) => {
    if(!res.categories) ws.send(`getcategories::session=${$.cookie('id')}`);
}).state('connected', (res) => {
    if(!$.cookie('id')) ws.send('newid');
    sm.state = 'teamnumber_ready';
}).state('teamnumber_ready', (res) => {
    ws.send(`team::session${$.cookie('id')}`);
});

ws.onmessage = msg => {
    // console.log(msg);
    let res = JSON.parse(msg.data);
    console.log(res);
    if(res.ping) {
        // Initial
        sm.state = 'connected';
    }
    if(res.id) {
        // After `connected`
        $.cookie('id', res.id.toString());
        sm.state = 'teamnumber_ready';
    }
    if(res.categories) {
        // After `populate_ready`
        console.log(res.categories);
        sm.state = 'loaded'
    }
    if(res.team) {
        env.team = res.team;
    }

    sm.update(res);
};

// pushData({foo: 'bar'});
// getCookies();
// console.log(n);
