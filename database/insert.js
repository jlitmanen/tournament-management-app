const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function createOrEditContent(req, res) {
    const { id, title: contentTitle, text: contentText } = req.body;
    const contentData = { contentTitle, contentText };

    try {
        await (id ? pb.collection('content').update(id, contentData) : pb.collection('content').create(contentData));
        res.status(200).send({ message: "Content created/updated successfully." });
    } catch (error) {
        res.status(500).send({ error: "An error occurred while creating/updating content." });
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
    const {
        id,
        homeId,
        awayId,
        homeWins,
        awayWins,
        date,
        reported,
        result,
        withdraw,
        played,
        openId,
    } = req.body;

    try {
        const [homePlayer, awayPlayer] = await Promise.all([
            pb.collection('player').getOne(homeId),
            pb.collection('player').getOne(awayId),
        ]);

        if (!homePlayer || !awayPlayer) {
            throw new Error('Players not found');
        }

        const modifier = getMatchModifier(homePlayer.group, awayPlayer.group);
        const data = {
            homeId,
            awayId,
            homeWins,
            awayWins,
            date,
            result,
            openId,
            reported: reported === 'on',
            withdraw: withdraw === 'on',
            played: played === 'on',
            factor: modifier,
        };

        const matchRecord = await (id ? pb.collection('match').update(id, data) : pb.collection('match').create(data));
        const openMatches = await pb.collection('match').getFullList({
            filter: `openId="${openId}"`,
            expand: 'home, away',
            sort: 'order',
        });

        const currentMatchIndex = openMatches.findIndex((match) => match.id === matchRecord.id);
        const winner = getWinner(matchRecord);

        if (winner !== null) {
            switch (currentMatchIndex) {
                case 0:
                case 1:
                case 2:
                case 3:
                    if (currentMatchIndex + 1 < openMatches.length && openMatches[currentMatchIndex + 1].player1 === undefined) {
                        await updateSubsequentMatch(openMatches[currentMatchIndex + 1].id, { player1: winner });
                    }
                    break;
                case 4:
                case 5:
                    if (currentMatchIndex + 1 < openMatches.length && openMatches[currentMatchIndex + 1].player2 === undefined) {
                        await updateSubsequentMatch(openMatches[currentMatchIndex + 1].id, { player2: winner });
                    }
                    break;
                default:
                    break;
            }
        }
    } catch (error) {
        console.error('Error inserting match:', error);
    }
}

function getWinner(match) {
    return match.homeWins !== match.awayWins ? (match.homeWins > match.awayWins ? match.home : match.away) : null;
}

function getMatchModifier(homeGroup, awayGroup) {
    if (homeGroup <= awayGroup) {
        return 1;
    } else if (homeGroup - awayGroup === 1) {
        return 1.5;
    } else {
        return 2;
    }
}

// Helper function to update a subsequent match
async function updateSubsequentMatch(matchId, data) {
  if (matchId === null || matchId === undefined) {
    console.error("Error: matchId is null or undefined. Cannot update subsequent match.");
    return;
  }

  if (data === null || data === undefined) {
    console.error("Error: data is null or undefined. Cannot update subsequent match.");
    return;
  }

  try {
    await pb.collection('match').update(matchId, data);
    console.log("Subsequent match updated successfully:", matchId);
  } catch (error) {
    console.error("Error updating subsequent match:", error);
    // Handle the error appropriately
  }
}

async function getWinner(match) {
    return match.homeWins !== match.awayWins ? 
           (match.homeWins > match.awayWins ? match.home : match.away) : 
           null;
}


module.exports = { insertContent, insertPlayer, insertMatch, insertTournament };