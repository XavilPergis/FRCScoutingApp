'use strict';

let team = undefined;

// GLOBALS ---------------------------------------------------------------------

window.ws = new WebSocket('ws://localhost:3000');
window.wsc = new WebSocketClient({ logger_enabled: true }, window.ws);
window.playMode = 'auto';

document.onload = (e) => {
    console.log('READY');
};
