'use strict';

// Object extend

// let a = { foo: 'bar' };
// let b = { baz: 'qux' };
// let c = a.extend(b);

// c => { foo: 'bar', baz: 'qux' };

// Object.defineProperty(Object.prototype, 'extend', {
//     enumerable: false,
//     value: function(from) {
//         var props = Object.getOwnPropertyNames(from);
//         var dest = this;
//         props.forEach(function(name) {
//             if(name in dest) {
//                 var destination = Object.getOwnPropertyDescriptor(from, name);
//                 Object.defineProperty(dest, name, destination);
//             }
//         });
//         return this;
//     }
// });

Object.prototype.extend = function(obj, override) {
    for(let k of Object.keys(obj)) {
        if(!this[k] || override) this[k] = obj[k];
    }
    return this;
};

// OBJECT REQUIREMENTS

Object.prototype.filter = function(cb) {
    let nobj = {};
    for(var k in this) if(this.hasOwnProperty(k)) {
        if(cb(k, this[k])) nobj[k] = this[k];
    }
    return nobj;
};
