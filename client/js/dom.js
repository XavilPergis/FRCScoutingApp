'use strict';

/**
 * A class that represents a binding to an element in the DOM.
 * This is used as an abstraction layer for the DOM.
 * @param {HTMLElement} node - 
 * @since 0.1.0
 * @class
 */
class DOMBinding {
    constructor(node) {
        let el = document.querySelectorAll(selector + '[dom-bind]');

    }

    /**
     * Gets all DOM nodes with the `dom-bind` attribute.
     * @return {array} A list of all vanilla JS DOM nodes with the `dom-bind` attribute.
     * @since 0.1.0
     * @static
     */
    static getAllBoundNodes() {
        return document.querySelectorAll('[dom-bind]');
    }

    /**
     * Gets all DOM nodes with the `dom-bind` attribute.
     * @return {array} A list of all vanilla JS DOM nodes with the `dom-bind` attribute.
     * @since 0.1.0
     * @static
     */
    static getAllBindings() {
        let el = DOMBinding.getAllBoundNodes();
        let bl = [];
        for(let i = 0; i < el.length; i++) bl.push(new DOMBinding())
    }
}

console.log(DOMBinding.getAllBoundNodes());
