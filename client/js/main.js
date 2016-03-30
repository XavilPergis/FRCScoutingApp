'use strict';

let team = undefined;

var ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    ws.send('team::get');
};

ws.onmessage = msg => {
    let type = msg.data.split('::')[0];
    let parts = msg.data.split('::').slice(1);
    switch(type) {
        case 'team':
            team = parts[0];
            break;
        default:
            console.log('Unknown websocket message');
    }
    // console.log(parts);
};
