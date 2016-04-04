'use strict';

const FRCApi = require('frc-events-api');

/**
 * This class represents a single FRC Team. All paramaters are final upon construction.
 * @param {number} number - The team number.
 * @param {string} name - The name of the team.
 * @param {string} alliance - The alliance the team is part of. Should be either red or blue
 * @throws {IllegalArgumentException} `alliance` must be either `red` or `blue`
 * @since 0.1.0
 * @class
 */
class Team {
    constructor(number, name, alliance) {
        this.name = name;
        this.number = number;
        if(['red', 'blue'].indexOf(alliance) > -1) this.alliance = alliance;
        else throw new IllegalArgumentException('`alliance` must be either "red" or "blue"');
    }

    /**
     * @return {string} Get the team's name.
     */
    get name() { return this.name };

    /**
     * @return {number} Get the team's number.
     */
    get number() { return this.number; };

    /**
     * @return {string} Get the team's alliance.
     */
    get alliance() { return this.alliance };

    static get FRCTeams() {
        let tl = [
            new Team(484, 'Roboforce', 'blue'),
        ]
    }

}
