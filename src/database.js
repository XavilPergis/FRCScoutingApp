'use strict';

const mongoose = require('mongoose');
const globals = require('./globals');
var Team = require('./teams');
const Schema = mongoose.Schema;
var db = mongoose.connection;

mongoose.connect('mongodb://localhost:3001');
//
// let _api = globals.env['FRC_API'];
//
// var TeamSchema = new Schema({
//     name: String,
//     number: Number,
//     comments: [String],
//     autonomous: {
//         highGoalsScored: Number,
//         highGoalsMissed: Number,
//         lowGoalsScored: Number,
//         lowGoalsMissed: Number,
//         roughTerrain: Number,
//         moat: Number,
//         sallyDoor: Number,
//         lowBar: Number
//     },
//     teleop: {
//         highGoalsScored: Number,
//         highGoalsMissed: Number,
//         lowGoalsScored: Number,
//         lowGoalsMissed: Number,
//         roughTerrain: Number,
//         moat: Number,
//         sallyDoor: Number,
//         lowBar: Number
//     }
// });
//
// var DBTeam = mongoose.model('team', TeamSchema);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected');
    // _api.teamListing({ eventCode: 'PAWCH' }, (data) => {
    //     for(let t of data) {
    //         console.log(t);
    //     }
    // });
    // let foo = new DBTeam({ name: 'Roboforce', number: 484 });
    // foo.save((err, foo) => {
    //     if(err) return console.error(err);
    //     console.log(foo);
    // });
    //
    // DBTeam.find({ number: 484 }, (err, teams) => {
    //     if(err) return console.error(err);
    //     console.log(teams);
    // });
    // // Query
    // DBTeam.update({ number: 484 }, {
    //
    // });
});

// mongod --dbpath ./data/db
