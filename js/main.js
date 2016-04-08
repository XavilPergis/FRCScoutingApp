'use strict';

let team = undefined;

// GLOBALS ---------------------------------------------------------------------

window.ws = new WebSocket('ws://' + window.location.hostname + ':3000');
window.wsc = new WebSocketClient({ logger_enabled: true }, window.ws);
window.matchStart = undefined;
window.matchNumber = undefined;
window.playMode = 'auto';

window.wsc.on('match', (parts, ws) => {
    let json = parts.join('::');
    let match = JSON.parse(json);

});
window.wsc.on('ka', (parts, ws) => {
    // A little server heartbeat.
    // Sends the team this client has.
    window.wsc.emit('ka', team);
});

document.onload = (e) => {
    console.log('READY');
};
