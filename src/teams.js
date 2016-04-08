'use strict';

// const async = require('async');
const FRCAPI = require('./frcapi');
const sensitive = require('./sensitive');
const TeamInUseException = require('./exception').TeamInUseException;

let globals = require('./globals');

let _teamsInUse = [];
let _teamsAvailable = [];
let _api = globals.env['FRC_API'];

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
        this._name = name;
        this._number = number;
        this._alliance = alliance;
        this._inuse = false;

        // Init static properties
        if(!Team._teamsInUse) Team._teamsInUse = [];
        if(!Team._teamsAvailable) Team._teamsAvailable = [];
        if(!Team._teamList) Team._teamList = [];

        // Push to list of all available teams if the team is not already listed
        // This prevents teams being listed twice
        let valid = true;
        for(let team of Team._teamsAvailable) valid &= team.name != this._name || team.number != this._number;

        if(Team._teamsAvailable && valid) Team._teamsAvailable.push(this);
        if(Team._teamList) Team._teamList.push(this);
    }

    /**
     * @return {string} Get the team's name.
     * @since 0.1.0
     */
    get name() { return this._name };

    /**
     * @return {number} Get the team's number.
     * @since 0.1.0
     */
    get number() { return this._number; };

    /**
     * @return {string} Get the team's alliance.
     * @since 0.1.0
     */
    get alliance() { return this._alliance };

    /**
     * Add to the list of teams currently in use
     * @throws {TeamInUseException} Team must be freed to use it.
     * @since 0.1.0
     */
    use() {
        if(!this._inuse) {
            this._inuse = true;
            Team._teamsInUse.push(this);
            Team._teamsAvailable = Team._teamsAvailable.filter(t => t !== this);
        }
        else throw new TeamInUseException(`Team ${this.number} already in use!`);
    }

    /**
     * Free the team for consumption.
     * @since 0.1.0
     */
    free() {
        if(this._inuse) {
            this._inuse = false;
            Team._teamsInUse = Team._teamsInUse.filter(t => t !== this);
        }
        else console.warn('Team freed but was not in use.');
    }

    /**
     * Returns a random team from the team registry.
     * @return {Team} - A random registered team
     * @since 0.1.0
     * @static
     */
    static getRandom() {
        let rn = Math.floor(Math.random() * Team._teamsAvailable.length);
        let slt = Team._teamsAvailable[rn];
        if(slt) {
            slt.use();
            return slt;
        } else console.warn('No more teams available.');
    }

    static repopTeams() {
        for(let team of Team._teamsInUse) team.free();
    }

    /**
    * Gets a list of all teams.
    * @return {Team[]} List of all teams.
    * @since 0.1.0
    * @static
    */
    static getAllTeams(cb) {
        if(!Team._cached) {
            Team._cached = [];
            _api.teamListing({
                eventCode: globals.env['EVENT_CODE']
            }, (data) => {
                // console.log(data);
                for(let t of data.teams) {
                    let team = new Team(t.nameShort, t.teamNumber);
                    // console.log(team);
                    Team._cached.push(team);
                }
                cb(Team._cached);
            });
        } else {
            let tl = [];
            for(let t of this._cached) tl.push(t);
            cb(tl);
        }
    }
}

module.exports = Team;
