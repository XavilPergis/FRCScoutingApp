'use strict';

let ws = new WebSocket('ws://localhost:3000');
console.log(ws);

$('#sb').click(e => {
    let val = $('#authform').val();
    ws.send(`auth::${val}`);
});

ws.onmessage = (msg) => {
    if(msg.data != 'auth::null') {
        // We got a valid response, woohoo!
        let parts = msg.data.split('::');
        $.cookie('sessid', parts[1],{ expires: new Date(parts[2]) });
        // We are done here; redirect to domain root
        window.location = '/';
    }
};
