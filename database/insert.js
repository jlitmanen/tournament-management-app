const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function insertContent(req, res) {
    const { id, title, text } = req.body;
    const data = { title, text };
    await (id ? pb.collection('content').update(id, data) : pb.collection('content').create(data));
}

async function insertTournament(req, res, next) {
    const { id, name, year = new Date().getFullYear(), active, ended } = req.body;
    const data = { name, year, active: active === 'on', ended: ended === 'on' };
    const tournament = await pb.collection('open').create(data);
    if (!id) await insertTournamentMatches(tournament);
}

async function insertTournamentMatches(tournament) {
    try {
        const players = await pb.collection('points').getList(1, 8, {});

        if (!players || !players.items || players.items.length < 8) {
            console.error("Virhe: Tarvittava määrä pelaajia ei löytynyt.");
            return; // Lopetetaan suoritus, jos pelaajia ei ole tarpeeksi
        }

        const matches = [];

        const createAndPushMatch = async (home, away, round) => {
            const matchData = {
                home: home,
                away: away,
                homeWins: 0,
                awayWins: 0,
                result: "",
                date: null,
                reported: false,
                played: false,
                withdraw: false,
                openRound: round,
                openId: tournament.id,
                factor: 1
            };

            const match = await pb.collection('match').create(matchData);
            matches.push(match.id);
        };

        // Ensimmäinen kierros
        await createAndPushMatch(players.items[0].id, players.items[7].id, 1);
        await createAndPushMatch(players.items[3].id, players.items[4].id, 1);
        await createAndPushMatch(players.items[1].id, players.items[6].id, 1);
        await createAndPushMatch(players.items[2].id, players.items[5].id, 1);

        // Toinen kierros (paikat täytetään myöhemmin)
        await createAndPushMatch(null, null, 2);
        await createAndPushMatch(null, null, 2);

        // Kolmas kierros (paikka täytetään myöhemmin)
        await createAndPushMatch(null, null, 3);

        await pb.collection('open').update(tournament.id, { field: matches });
        console.log("Ottelut lisätty onnistuneesti.");
    } catch (error) {
        console.error("Virhe lisättäessä otteluita:", error);
    }
}

async function insertPlayer(req) {
    const { id, name, group, points } = req.body;
    const data = { name, group, points };
    await (id ? pb.collection('player').update(id, data) : pb.collection('player').create(data));
}

async function insertMatch(req) {
    const { id, home, away, homeWins, awayWins, date, reported, result, withdraw, played, openId } = req.body;

    const winner = await pb.collection('player').getOne(homeWins > awayWins ? home : away);
    const loser = await pb.collection('player').getOne(homeWins > awayWins ? away : home);
    const modifier = winner.group <= loser.group ? 1 : winner.group - loser.group === 1 ? 1.5 : 2;

    const data = {
        home, away, homeWins, awayWins, date, result, openId,
        reported: reported === 'on', withdraw: withdraw === 'on', played: played === 'on',
        factor: modifier
    };

    await (id ? pb.collection('match').update(id, data) : pb.collection('match').create(data));
}

module.exports = { insertContent, insertPlayer, insertMatch, insertTournament };