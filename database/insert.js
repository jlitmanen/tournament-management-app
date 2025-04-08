const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function insertContent(req, res) {
    const { id, title, text } = req.body;
    const data = { title, text };
    try {
        await (id ? pb.collection('content').update(id, data) : pb.collection('content').create(data));
        // Voit lähettää onnistumisvastauksen tässä
        res.status(200).send({ message: "Sisältö lisätty/päivitetty onnistuneesti." });
    } catch (error) {
        console.error("Virhe sisällön lisäyksessä/päivityksessä:", error);
        // Voit lähettää virhevastauksen tässä
        res.status(500).send({ error: "Sisällön lisäyksessä/päivityksessä tapahtui virhe." });
    }
}

async function insertTournament(req, res, next) {
    const { id, name, year = new Date().getFullYear(), active, ended } = req.body;
    const data = { name, year, active: active === 'on', ended: ended === 'on' };

    try {
        const tournament = id
            ? await pb.collection('open').update(id, data)
            : await pb.collection('open').create(data);

        if (!id) {
            await insertTournamentMatchesInternal(tournament); // Sisäinen funktio
        }

        // Jos tämä on middleware, voit kutsua next()
        // if (next) next();
    } catch (error) {
        console.error("Virhe turnauksen lisäyksessä/päivityksessä:", error);
        // Voit lähettää virhevastauksen tässä, jos tämä on reitinkäsittelijä
        // res.status(500).send({ error: "Turnauksen lisäyksessä/päivityksessä tapahtui virhe." });
    }
}

async function insertTournamentMatchesInternal(tournament) { // Tehdään sisäiseksi
    try {
        const players = await pb.collection('points').getList(1, 8, {});

        if (!players || !players.items || players.items.length < 8) {
            console.error("Virhe: Tarvittava määrä pelaajia ei löytynyt turnauksen otteluiden luontiin.");
            return;
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

        await createAndPushMatch(players.items[0].id, players.items[7].id, 1);
        await createAndPushMatch(players.items[3].id, players.items[4].id, 1);
        await createAndPushMatch(players.items[1].id, players.items[6].id, 1);
        await createAndPushMatch(players.items[2].id, players.items[5].id, 1);

        await createAndPushMatch(null, null, 2);
        await createAndPushMatch(null, null, 2);

        await createAndPushMatch(null, null, 3);

        await pb.collection('open').update(tournament.id, { matchIds: matches }); // Selkeämpi kentän nimi
        console.log("Ottelut lisätty onnistuneesti turnaukselle:", tournament.id);
    } catch (error) {
        console.error("Virhe lisättäessä otteluita turnaukselle:", error);
    }
}

async function insertPlayer(req) {
    const { id, name, group, points } = req.body;
    const data = { name, group, points };
    try {
        await (id ? pb.collection('player').update(id, data) : pb.collection('player').create(data));
        // Voit lähettää onnistumisvastauksen
    } catch (error) {
        console.error("Virhe pelaajan lisäyksessä/päivityksessä:", error);
        // Voit lähettää virhevastauksen
    }
}

async function insertMatch(req) {
    const { id, home, away, homeWins, awayWins, date, reported, result, withdraw, played, openId } = req.body;

    try {
        const homePlayer = await pb.collection('player').getOne(home);
        const awayPlayer = await pb.collection('player').getOne(away);

        // Tarkistetaan, löytyivätkö pelaajat
        if (!homePlayer || !awayPlayer) {
            console.error("Virhe: Pelaajia ei löytynyt ottelua varten.");
            return; // Tai heitä virhe
        }

        let modifier = 1;
        if (homeWins > awayWins) {
            modifier = homePlayer.group <= awayPlayer.group ? 1 : homePlayer.group - awayPlayer.group === 1 ? 1.5 : 2;
        } else if (awayWins > homeWins) {
            modifier = awayPlayer.group <= homePlayer.group ? 1 : awayPlayer.group - homePlayer.group === 1 ? 1.5 : 2;
        }

        const data = {
            home, away, homeWins, awayWins, date, result, openId,
            reported: reported === 'on', withdraw: withdraw === 'on', played: played === 'on',
            factor: modifier
        };

        await (id ? pb.collection('match').update(id, data) : pb.collection('match').create(data));
        // Voit lähettää onnistumisvastauksen
    } catch (error) {
        console.error("Virhe ottelun lisäyksessä/päivityksessä:", error);
        // Voit lähettää virhevastauksen
    }
}

module.exports = { insertContent, insertPlayer, insertMatch, insertTournament };