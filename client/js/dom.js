'use strict';

class DOMBinding {
    constructor() {

    }
    static getAllBoundNodes() {
        console.log($('[dom-bind]'));
    }
}

console.log(DOMBinding.getAllBoundNodes());
