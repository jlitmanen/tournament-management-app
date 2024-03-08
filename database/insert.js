var db = require('./db');
const {fetchRanking} = require('./query.js');

function insertContent(req, res) {
    console.log(req.body);
    var id = req.body.id === '' ? null : req.body.id;
    db.run("REPLACE INTO content (id, title, text) VALUES (?, ?, ?)", 
    [id, req.body.title, req.body.text], (err) => {
        if(err) {
            return console.log(err.message); 
        }
    })
};


function insertTournament(req, res, next) {
    console.log(req.body);
    var id = req.body.id === '' ? null : req.body.id;
    var year = req.body.year === '' ? new Date().getFullYear() : req.body.year;
    var active = req.body.active === 'on' ? true : false;
    var ended = req.body.ended  === 'on' ? true : false;
    db.run("REPLACE INTO tournament (id, name, active, ended, year) VALUES (?,?,?,?,?)", 
    [
        id, 
        req.body.name, 
        active, 
        ended, 
        year
    ], (err) => {
        if(err) {
            return console.log(err.message); 
        }
    })
    if(req.body.id === '') {
        insertTournamentMatches(req.body, req, res, next);
    }
};

function insertTournamentMatches(tournament) {
    let players = [];
    fetchTopEight(function(data) {
        players = data;
        console.log(players);
    });
    
    // first stage 1-8 : 4-5 x 2-7 : 3-6
    createMatch(players[0], players[6], tournament, 1);
    createMatch(players[3], players[4], tournament, 1);
    createMatch(players[1], players[6], tournament, 1);
    createMatch(players[2], players[5], tournament, 1);
    createMatch(null, null, tournament, 2);
    createMatch(null, null, tournament, 2);
    createMatch(null, null, tournament, 3);

}

function fetchTopEight(callback) {
    var query = "SELECT id FROM player order by ranking_points desc LIMIT 8";
    var data = []; //for storing the rows.
    db.each(query, function(err, row) {
        data.push(row); //pushing rows into array
    }, function(){ 
        callback(data); 
    });
}

function createMatch(home, away, open, round) {
    db.run("INSERT INTO matches (id, player1, player2, wins1, wins2, game_date, reported, result, withdraw, played, tournament_id, tournament_round) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);", 
    [
        null,
        home,
        away,
        0,
        0,
        null,
        false,
        '',
        false,
        false,
        open,
        round
    ], (err) => {
        if(err) {
            return console.log(err.message); 
        }
    })
}

function insertPlayer (req, res) {
    var id = req.body.id === '' ? null : req.body.id;
    console.log(req.body);
    db.run("REPLACE INTO player (id, name, player_group, ranking_points) VALUES (?, ?, ?, ?)", 
    [id, req.body.name, req.body.group, req.body.points], (err) => {
        if(err) {
            return console.log(err.message); 
        }
    })
};

function insertMatch (req, res, next) {
    console.log(req.body);
    db.run("REPLACE INTO matches (id, player1, player2, wins1, wins2, game_date, reported, result, withdraw, played, tournament_id) VALUES (?,?,?,?,?,?,?,?,?,?,?);", 
    [
        req.body.id === '' ? null : req.body.id,
        req.body.p1,
        req.body.p2,
        req.body.wins1,
        req.body.wins2,
        req.body.game_date,
        req.body.reported === 'on' ? true : false,
        req.body.result,
        req.body.withdraw === 'on' ? true : false,
        req.body.played === 'on' ? true : false,
        req.body.opens,
    ], (err) => {
        if(err) {
            return console.log(err.message); 
        }
    })
    var m = req.body;
    var winner = m.wins1 > m.wins2 ? m.p1 : m.p2;
    var loser = m.wins1 > m.wins2 ? m.p2 : m.p1;
    updatePoints(m, winner, loser);
};

function updatePoints(m, winner, loser) {
    if(m.opens === null) {
        var winnerGroup = m.p1 === winner ? m.p1group : m.p2group;
        var loserGroup = m.p1 === winner ? m.p2group : m.p1group;
        var winnerWins = m.p1 === winner ? m.wins1 : m.wins2;
        var modifier = groupModifier(winnerGroup, loserGroup);
        console.log("MODIFIER: " + modifier);
        
        var points = (winnerWins * modifier) + 1;
        points = withdraw === 'on' ? points / 2 : points;
        addPoints(winner, points);
        addPoints(loser, withdraw === 'on' ? 0 : 1);
    } else {
        var points = m.t_round === 3 ? 6 : 3;
        addPoints(winner, points);
    }
}

function addPoints(player, points) {
    console.log("PELAAJA: " + player + " PISTEET: " + points);
    db.run("UPDATE player SET ranking_points = ranking_points + ? WHERE id = ?", 
    [points, player], (err) => {
        if(err) {
            return console.log(err.message); 
        }
    })
}

function groupModifier(winnerGroup, loserGroup) {
    var compare = winnerGroup - loserGroup;
    if (winnerGroup <= loserGroup) return 1;
    return compare === 1 ? 1.5 : 2;
}

module.exports = { insertContent, insertPlayer, insertMatch, insertTournament };