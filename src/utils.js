'use strict';

Object.prototype.extend = function(obj, override) {
    let ocpy = Object.create(this);
    for(let k of Object.keys(obj)) {
        if(!ocpy[k] || override) ocpy[k] = obj[k];
    }
    return ocpy;
};

Object.prototype.filter = function(cb) {
    let nobj = {};
    for(var k in this) if(this.hasOwnProperty(k)) {
        if(cb(k, this[k])) nobj[k] = this[k];
    }
    return nobj;
};
