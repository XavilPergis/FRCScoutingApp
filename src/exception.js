'use strict';

/**
 * Exception meant to be thrown if an invalid argument is passed to a function
 * @param {string} message - The message to be displayed on error. Defaults to `''`
 * @since 0.1.0
 * @class
 */
class IllegalArgumentException extends Error {
    constructor(message) {
        super(message);
        this.name = 'IllegalArgumentException';
        this.message = message || '';
        this.stack = (new Error()).stack;
    }
}

/**
 * Exception meant to be thrown if `team.use()` is called on an already in-use team.
 * @param {string} message - The message to be displayed on error. Defaults to `''`
 * @since 0.1.0
 * @class
 */
class TeamInUseException extends Error {
    constructor(message) {
        super(message);
        this.name = 'TeamInUseException';
        this.message = message || '';
        this.stack = (new Error()).stack;
    }
}

module.exports = {
    IllegalArgumentException: IllegalArgumentException,
    TeamInUseException: TeamInUseException
};
