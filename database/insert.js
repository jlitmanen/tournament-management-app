const PocketBase = require("pocketbase/cjs");

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function insertContent(req, res) {
  const { id, title, text } = req.body;
  const data = { title, text };
  try {
    await (id
      ? pb.collection("content").update(id, data)
      : pb.collection("content").create(data));
    // Voit lähettää onnistumisvastauksen tässä
    res
      .status(200)
      .send({ message: "Sisältö lisätty/päivitetty onnistuneesti." });
  } catch (error) {
    console.error("Virhe sisällön lisäyksessä/päivityksessä:", error);
    // Voit lähettää virhevastauksen tässä
    res
      .status(500)
      .send({ error: "Sisällön lisäyksessä/päivityksessä tapahtui virhe." });
  }
}

async function insertTournament(req, res, next) {
  const { id, name, year = new Date().getFullYear(), active, ended } = req.body;
  const data = { name, year, active: active === "on", ended: ended === "on" };

  try {
    const tournament = id
      ? await pb.collection("open").update(id, data)
      : await pb.collection("open").create(data);

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

async function insertTournamentMatchesInternal(tournament) {
  // Tehdään sisäiseksi
  try {
    const players = await pb.collection("points").getList(1, 8, {});

    if (!players || !players.items || players.items.length < 8) {
      console.error(
        "Virhe: Tarvittava määrä pelaajia ei löytynyt turnauksen otteluiden luontiin.",
      );
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
        factor: 1,
      };

      const match = await pb.collection("match").create(matchData);
      matches.push(match.id);
    };

    await createAndPushMatch(players.items[0].id, players.items[7].id, 1);
    await createAndPushMatch(players.items[3].id, players.items[4].id, 1);
    await createAndPushMatch(players.items[1].id, players.items[6].id, 1);
    await createAndPushMatch(players.items[2].id, players.items[5].id, 1);

    await createAndPushMatch(null, null, 2);
    await createAndPushMatch(null, null, 2);

    await createAndPushMatch(null, null, 3);

    await pb.collection("open").update(tournament.id, { matches: matches }); // Selkeämpi kentän nimi
    console.log("Ottelut lisätty onnistuneesti turnaukselle:", tournament.id);
  } catch (error) {
    console.error("Virhe lisättäessä otteluita turnaukselle:", error);
  }
}

async function insertPlayer(req) {
  const { id, name, group, points } = req.body;
  const data = { name, group, points };
  try {
    await (id
      ? pb.collection("player").update(id, data)
      : pb.collection("player").create(data));
    // Voit lähettää onnistumisvastauksen
  } catch (error) {
    console.error("Virhe pelaajan lisäyksessä/päivityksessä:", error);
    // Voit lähettää virhevastauksen
  }
}
async function insertMatch(req) {
  const {
    id,
    home,
    away,
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
    const homePlayer = await pb.collection("player").getOne(home);
    const awayPlayer = await pb.collection("player").getOne(away);

    // Tarkistetaan, löytyivätkö pelaajat
    if (!homePlayer || !awayPlayer) {
      console.error("Virhe: Pelaajia ei löytynyt ottelua varten.");
      return; // Tai heitä virhe
    }

    let modifier = 1;
    if (homeWins > awayWins) {
      modifier =
        homePlayer.group <= awayPlayer.group
          ? 1
          : homePlayer.group - awayPlayer.group === 1
            ? 1.5
            : 2;
    } else if (awayWins > homeWins) {
      modifier =
        awayPlayer.group <= homePlayer.group
          ? 1
          : awayPlayer.group - homePlayer.group === 1
            ? 1.5
            : 2;
    }

    const data = {
      home,
      away,
      homeWins,
      awayWins,
      date,
      result,
      openId,
      reported: reported === "on",
      withdraw: withdraw === "on",
      played: played === "on",
      factor: modifier,
    };

    // Create or update the match
    const matchRecord = await (id
      ? pb.collection("match").update(id, data)
      : pb.collection("match").create(data));

    // --- New logic to update subsequent matches ---

    // Fetch all matches for this open tournament, ordered correctly
    const openMatches = await pb.collection("match").getFullList({
      filter: 'openId="' + openId + '"',
      expand: "home, away",
      sort: "order", // Or '-order' depending on your desired sorting
    });

    // Find the index of the current match in the sorted list
    const currentMatchIndex = openMatches.findIndex(
      (match) => match.id === matchRecord.id,
    );

    // Implement the update logic based on the index
    // This is similar to the Java code, but using the openMatches array
    if (getWinner(matchRecord) !== null) {
      // Only update subsequent matches if the current match has a winner
      switch (currentMatchIndex) {
        case 0: // If the current match is the first one
          if (openMatches.length > 4 && openMatches[4].player1 === undefined) {
            // Check if match 4 exists and needs player1
            await updateSubsequentMatch(openMatches[4].id, {
              player1: getWinner(matchRecord),
            });
          }
          break;
        case 1: // If the current match is the second one
          if (openMatches.length > 4 && openMatches[4].player2 === undefined) {
            // Check if match 4 exists and needs player2
            await updateSubsequentMatch(openMatches[4].id, {
              player2: getWinner(matchRecord),
            });
          }
          break;
        case 2: // If the current match is the third one
          if (openMatches.length > 5 && openMatches[5].player1 === undefined) {
            // Check if match 5 exists and needs player1
            await updateSubsequentMatch(openMatches[5].id, {
              player1: getWinner(matchRecord),
            });
          }
          break;
        case 3: // If the current match is the fourth one
          if (openMatches.length > 5 && openMatches[5].player2 === undefined) {
            // Check if match 5 exists and needs player2
            await updateSubsequentMatch(openMatches[5].id, {
              player2: getWinner(matchRecord),
            });
          }
          break;
        case 4: // If the current match is the fifth one
          if (openMatches.length > 6 && openMatches[6].player1 === undefined) {
            // Check if match 6 exists and needs player1
            await updateSubsequentMatch(openMatches[6].id, {
              player1: getWinner(matchRecord),
            });
          }
          break;
        case 5: // If the current match is the sixth one
          if (openMatches.length > 6 && openMatches[6].player2 === undefined) {
            // Check if match 6 exists and needs player2
            await updateSubsequentMatch(openMatches[6].id, {
              player2: getWinner(matchRecord),
            });
          }
          break;
        default:
          break;
      }
    }

    // Voit lähettää onnistumisvastauksen
  } catch (error) {
    console.error("Virhe ottelun lisäyksessä/päivityksessä:", error);
    // Voit lähettää virhevastauksen
  }
}

// Helper function to update a subsequent match
async function updateSubsequentMatch(matchId, data) {
  try {
    await pb.collection("match").update(matchId, data);
    console.log("Subsequent match updated successfully:", matchId);
  } catch (error) {
    console.error("Error updating subsequent match:", error);
    // Handle the error appropriately
  }
}

// You'll also need the getWinner function here or imported
async function getWinner(match) {
  if (match.homeWins > match.awayWins) {
    return match.home;
  } else if (match.awayWins > match.homeWins) {
    return match.away;
  } else {
    return null;
  }
}

module.exports = { insertContent, insertPlayer, insertMatch, insertTournament };
