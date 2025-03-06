require('express');
const PocketBase = require('pocketbase/cjs');

const url = process.env.POCKETBASE_URL;
const pb = new PocketBase(url)

async function insertContent(req, res) {
    const id = req.body.id === '' ? null : req.body.id;
    const data = {
        title: req.body.title,
        text: req.body.text
    }
    if(id === null) {
        await pb.collection('content').create(data);
    } else {
        await pb.collection('content').update(id, data);
    }
}
async function insertTournament(req, res, next) {
    const id = req.body.id === '' ? null : req.body.id;
    const year = req.body.year === '' ? new Date().getFullYear() : req.body.year;
    const active = req.body.active === 'on';
    const ended = req.body.ended === 'on';
    let data = {
        id: id,
        name: req.body.name,
        year: year,
        active: active,
        ended: ended,
    }
    const record = await pb.collection('open').create(data)
    if(req.body.id === '') {
        await insertTournamentMatches(record, req, res, next);
    }
};

async function insertTournamentMatches(tournament) {
    try {
        let players = await new Promise((resolve) => {
            fetchTopEight(resolve);
        });
        console.log(players);

        let matches = [];
        // first stage 1-8 : 4-5 x 2-7 : 3-6
        const match1 = await createMatch(players[0], players[7], tournament, 1);
        matches.push(match1.id);

        const match2 = await createMatch(players[3], players[4], tournament, 1);
        matches.push(match2.id);

        const match3 = await createMatch(players[1], players[6], tournament, 1);
        matches.push(match3.id);

        const match4 = await createMatch(players[2], players[5], tournament, 1);
        matches.push(match4.id);

        // Myöhemmät vaiheet, pelaajat määritetään myöhemmin
        const match5 = await createMatch(null, null, tournament, 2);
        matches.push(match5.id);

        const match6 = await createMatch(null, null, tournament, 2);
        matches.push(match6.id);

        const match7 = await createMatch(null, null, tournament, 3);
        matches.push(match7.id);

        tournament.field.push(matches);
        await pb.collection('open').update(tournament.id, tournament);

        console.log("Ottelut lisätty onnistuneesti.");
    } catch (error) {
        console.error("Virhe lisättäessä otteluita:", error);
        // Voit lisätä tähän virheenkäsittelylogiikkaa, esim. palauttaa virheen tai näyttää viestin käyttäjälle.
    }
}

async function fetchTopEight(callback) {
    const data = await pb.collection('ranking').getList(1, 8, {});
    callback(data);
}

async function createMatch(home, away, open, round) {
    const data = {
        "home": home?.id,
        "away": away?.id,
        "homeWins": 0,
        "awayWins": 0,
        "result": "",
        "date": null,
        "reported": false,
        "played": false,
        "withdraw": false,
        "openRound": round,
        "openId": open.id,
        "factor": 1
    };
    await pb.collection('match').create(data);
}

async function insertPlayer (req) {
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

async function insertMatch (req, next) {
    let m = req.body;
    let winner = m.homeWins > m.awayWins ? m.home : m.away;
    let loser = m.homeWins > m.awayWins ? m.away : m.home;

    winner = await pb.collection('player').getOne(winner, {});
    loser = await pb.collection('player').getOne(loser, {});
    let modifier = groupModifier(winner.group, loser.group);

    const data = {
        "id": req.body.id === '' ? null : req.body.id,
        "home": req.body.home,
        "away": req.body.away,
        "homeWins": req.body.homeWins,
        "awayWins": req.body.awayWins,
        "date": req.body.date,
        "reported": req.body.reported === 'on',
        "result": req.body.result,
        "withdraw": req.body.withdraw === 'on',
        "played": req.body.played === 'on',
        "openId": req.body.openId,
        "factor": modifier ? modifier : 1,
    };

    if (req.body.id === '') {
        await pb.collection('match').create(data);
    } else {
        await pb.collection('match').update(req.body.id, data);
    }
}

async function groupModifier(winnerGroup, loserGroup) {
    const compare = winnerGroup - loserGroup;
    if (winnerGroup <= loserGroup) return 1;
    return compare === 1 ? 1.5 : 2;
}

module.exports = { insertContent, insertPlayer, insertMatch, insertTournament };