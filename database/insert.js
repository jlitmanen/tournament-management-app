const { run, transaction } = require("./db.js");
const { getPlayerById } = require("./query.js");

/* -------------------------------------------------
   1️⃣ Content (create / update)
---------------------------------------------------*/
async function insertContent(req, res) {
  const { id, title, text } = req.body;
  const sqlInsert = `
    INSERT INTO content (title, text) VALUES (?, ?)
    RETURNING id;
  `;
  const sqlUpdate = `
    UPDATE content SET title = ?, text = ? WHERE id = ?
    RETURNING id;
  `;

  try {
    const rows = id
      ? await run(sqlUpdate, [title, text, id])
      : await run(sqlInsert, [title, text]);

    res.status(200).send({ message: "Sisältö tallennettu.", id: rows[0]?.id });
  } catch (error) {
    console.error("Virhe sisällön lisäyksessä/päivityksessä:", error);
    res
      .status(500)
      .send({ error: "Sisällön lisäyksessä/päivityksessä tapahtui virhe." });
  }
}

/* -------------------------------------------------
   2️⃣ Tournament (open) – create / update
---------------------------------------------------*/
async function insertTournament(req, res, next) {
  const { id, name, year = new Date().getFullYear(), active, ended } = req.body;
  const data = {
    name,
    year,
    active: active === "on" || active === true || active === 1 ? 1 : 0,
    ended: ended === "on" || ended === true || ended === 1 ? 1 : 0,
  };

  const sqlInsert = `
    INSERT INTO tournament (name, year, active, ended) VALUES (?, ?, ?, ?)
    RETURNING id;
  `;
  const sqlUpdate = `
    UPDATE tournament SET name = ?, year = ?, active = ?, ended = ? WHERE id = ?
    RETURNING id;
  `;

  try {
    const rows = id
      ? await run(sqlUpdate, [
          data.name,
          data.year,
          data.active,
          data.ended,
          id,
        ])
      : await run(sqlInsert, [data.name, data.year, data.active, data.ended]);

    if (res && res.status) {
      res
        .status(200)
        .send({ message: "Turnaus tallennettu.", id: rows[0]?.id });
    }
    if (next) next();
  } catch (error) {
    console.error("Virhe turnauksen lisäyksessä/päivityksessä:", error);
    if (res && res.status) {
      res.status(500).send({ error: "Turnauksen tallennus epäonnistui." });
    } else if (next) {
      next(error);
    }
  }
}

/* -------------------------------------------------
   3️⃣ Player – create / update
---------------------------------------------------*/
async function insertPlayer(req, res, next) {
  const { id, name, group, points } = req.body;
  const sqlInsert = `
    INSERT INTO player (name, "group",) VALUES (?, ?, ?)
    RETURNING id;
  `;
  const sqlUpdate = `
    UPDATE player SET name = ?, "group" = ?, points = ? WHERE id = ?
    RETURNING id;
  `;

  try {
    const rows = id
      ? await run(sqlUpdate, [name, group, points, id])
      : await run(sqlInsert, [name, group, points]);

    if (res && res.status) {
      res
        .status(200)
        .send({ message: "Pelaaja tallennettu.", id: rows[0]?.id });
    }
    if (next) next();
  } catch (error) {
    console.error("Virhe pelaajan lisäyksessä/päivityksessä:", error);
    if (res && res.status) {
      res.status(500).send({ error: "Pelaajan tallennus epäonnistui." });
    } else if (next) {
      next(error);
    }
  }
}

/**
 * 4️⃣ Match – create / update (with factor logic)
 */
async function insertMatch(req, res) {
  console.log("insertMatch called with body:", req.body);

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
    // 1. Ensure IDs are Numbers and fetch player data for factor calculation
    const homeId = Number(home);
    const awayId = Number(away);

    const hp = await getPlayerById(homeId);
    const ap = await getPlayerById(awayId);

    if (!hp || !ap) {
      return res.status(404).send({
        error: `Pelaajia ei löytynyt. (Koti: ${home}, Vieras: ${away})`,
      });
    }

    const matchRow = await transaction(async (tx) => {
      // 2. Factor calculation logic
      let modifier = 1;
      const hGroup = Number(hp.group || hp.Ryhma || 0);
      const aGroup = Number(ap.group || ap.Ryhma || 0);
      const hWins = Number(homeWins) || 0;
      const aWins = Number(awayWins) || 0;

      if (hWins > aWins) {
        modifier = hGroup <= aGroup ? 1 : hGroup - aGroup === 1 ? 1.5 : 2;
      } else if (aWins > hWins) {
        modifier = aGroup <= hGroup ? 1 : aGroup - hGroup === 1 ? 1.5 : 2;
      }

      // 3. Prepare data object with strict types
      const data = {
        player1: homeId,
        player2: awayId,
        wins1: hWins,
        wins2: aWins,
        game_date: date,
        result: result || "",
        tournament_id: openId ? Number(openId) : null,
        reported:
          reported === "on" || reported === true || reported === 1 ? 1 : 0,
        withdraw:
          withdraw === "on" || withdraw === true || withdraw === 1 ? 1 : 0,
        played: played === "on" || played === true || played === 1 ? 1 : 0,
        factor: modifier,
      };

      console.log("Saving to DB:", data);

      if (id) {
        // UPDATE existing match
        await tx.execute(
          `UPDATE matches
           SET player1 = ?, player2 = ?, wins1 = ?, wins2 = ?, game_date = ?,
               result = ?, tournament_id = ?, reported = ?, withdraw = ?,
               played = ?, factor = ?
           WHERE id = ?`,
          [
            data.player1,
            data.player2,
            data.wins1,
            data.wins2,
            data.game_date,
            data.result,
            data.tournament_id,
            data.reported,
            data.withdraw,
            data.played,
            data.factor,
            id,
          ],
        );
        return { id };
      } else {
        // INSERT new match
        const dbResult = await tx.execute(
          `INSERT INTO matches (
            player1, player2, wins1, wins2, game_date,
            result, tournament_id, reported, withdraw, played, factor
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id`,
          [
            data.player1,
            data.player2,
            data.wins1,
            data.wins2,
            data.game_date,
            data.result,
            data.tournament_id,
            data.reported,
            data.withdraw,
            data.played,
            data.factor,
          ],
        );

        // Return the first row from the result (standard for RETURNING id)
        return dbResult.rows
          ? dbResult.rows[0]
          : { id: dbResult.lastInsertRowid };
      }
    });

    res.status(200).send({
      message: "Ottelu tallennettu.",
      id: matchRow.id,
    });
  } catch (error) {
    console.error("Virhe ottelun tallennuksessa:", error);
    res.status(500).send({ error: error.message || "Tallennus epäonnistui." });
  }
}

module.exports = {
  insertContent,
  insertTournament,
  insertPlayer,
  insertMatch,
};
