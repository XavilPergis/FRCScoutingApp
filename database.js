'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var db = mongoose.connection;

mongoose.connect('mongodb://localhost:3001');

var TeamSchema = new Schema({
    name: String,
    number: Number,
    comments: [String],
    autonomous: {
        highGoalsScored: Number,
        highGoalsMissed: Number,
        lowGoalsScored: Number,
        lowGoalsMissed: Number,
        roughTerrain: Number,
        moat: Number,
        sallyDoor: Number,
        lowBar: Number
    },
    teleop: {
        highGoalsScored: Number,
        highGoalsMissed: Number,
        lowGoalsScored: Number,
        lowGoalsMissed: Number,
        roughTerrain: Number,
        moat: Number,
        sallyDoor: Number,
        lowBar: Number
    }
});

var Team = mongoose.model('team', TeamSchema);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected');
    let foo = new Team({name: 'Roboforce', number: 484});
    foo.save((err, foo) => {
        if(err) return console.error(err);
        console.log(foo);
    });
    // Get all in Schema
    Team.find((err, teams) => {
        if(err) return console.error(err);
        console.log(teams);
    });
    // Query
    Team.find({ number: 484 }, (err, team) => {
        if(err) return console.error(err);
        console.log(team);
    });
});
