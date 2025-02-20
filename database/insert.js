const e = require('express');
const {fetchRanking} = require('./query.js');
const PocketBase = require('pocketbase/cjs');

const url = process.env.POCKETBASE_URL;
const pb = new PocketBase(url)

async function insertContent(req, res) {
    var id = req.body.id === '' ? null : req.body.id;
    var data = {
        title: req.body.title,
        text: req.body.text
    }
    if(id === null) {
        const record = await pb.collection('content').create(data);
    } else {
        const record = await pb.collection('content').update(id, data);
    }
};


async function insertTournament(req, res, next) {
    console.log(req.body);
    var id = req.body.id === '' ? null : req.body.id;
    var year = req.body.year === '' ? new Date().getFullYear() : req.body.year;
    var active = req.body.active === 'on' ? true : false;
    var ended = req.body.ended  === 'on' ? true : false;
    let data = {
        id: id = id,
        name: req.body.name,
        year: year,
        active: active,
        ended: ended,
    }
    const record = await pb.collection('open').create(data)
    if(req.body.id === '') {
        insertTournamentMatches(record, req, res, next);
    }
};

async function insertTournamentMatches(tournament) {
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

async function fetchTopEight(callback) {
    const data = await pb.collection('ranking').getList(1, 8, {});
    callback(data);
}

async function createMatch(home, away, open, round) {
    const data = {
        "home": home,
        "away": away,
        "homeWins": 0,
        "awayWins": 0,
        "result": "",
        "date": null,
        "reported": false,
        "played": false,
        "withdraw": false,
        "openRound": round,
        "openId": open
    };
    const record = await pb.collection('match').create(data);
}

async function insertPlayer (req, res) {
    const id = req.params.id;
    const data = {
        "id": req.body.id === '' ? null : req.body.id,
        "name": req.body.name,
        "group": req.body.group,
        "points": req.body.points
    };
    if(data.id != null) {
        await pb.collection('player').update(req.body.id, data);
    } else {
        await pb.collection('player').create(data);
    }
}

async function insertMatch (req, res, next) {
    const data = {
        "id": req.body.id === '' ? null : req.body.id,
        "home": req.body.p1,
        "away": req.body.p2,
        "homeWins": req.body.wins1,
        "awayWins": req.body.wins2,
        "date": req.body.game_date,
        "reported": req.body.reported === 'on' ? true : false,
        "result": req.body.result,
        "withdraw": req.body.withdraw === 'on' ? true : false,
        "played": req.body.played === 'on' ? true : false,
        "open": req.body.opens,
    };
    if (req.body.id === '') {
        const m = await pb.collection('match').create(data);
    } else {
        const m = await pb.collection('match').update(req.body.id, data);
    }

    var winner = m.homeWins > m.awayWins ? m.home : m.away;
    var loser = m.homeWins > m.awayWins ? m.away : m.home;
    updatePoints(m, winner, loser);
};

async function updatePoints(m, winner, loser) {
    if(m.opens === null || m.opens === '') {
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

async function addPoints(player, points) {
    console.log("PELAAJA: " + player + " PISTEET: " + points);
    const data = {
        "points": points
    };
    const record = await pb.collection('player').update(player, data);
}

async function groupModifier(winnerGroup, loserGroup) {
    var compare = winnerGroup - loserGroup;
    if (winnerGroup <= loserGroup) return 1;
    return compare === 1 ? 1.5 : 2;
}

module.exports = { insertContent, insertPlayer, insertMatch, insertTournament };