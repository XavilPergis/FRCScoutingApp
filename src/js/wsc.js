'use strict';
class WebSocketClient {
    constructor(opts, ws) {
        this.opts = opts;
        this.ehl = [];

        ws.onmessage = (rawmsg) => {
            let msg = rawmsg.data;

            let chan = msg.split('::')[0];
            let parts = msg.split('::').slice(1);
            if(opts.logger_enabled) console.log(`WS -->\t${chan}\t[ ${parts.join(', ')} ]`);
            for(let ch of this.ehl) if(ch.name === chan) ch.cb(parts, ws, rawmsg);
        };
    }
    emit(chan, data) {
        let _data = data ? `::${data}` : '::__NODATA';
        if(this.opts.logger_enabled) console.log(`WS <--\t${chan}\t${data}`);
        ws.send(`${chan}${_data}`);
    }
    on(name, cb) {
        this.ehl.push({ name: name, cb: cb });
    }
}
