// handlers.js
import { run, transaction } from "./db.js";
/* -------------------------------------------------
   1️⃣ Content (create / update)
---------------------------------------------------*/
export async function insertContent(req, res) {
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

    res.status(200).send({
      message: "Sisältö lisätty/päivitetty onnistuneesti.",
      id: rows[0]?.id ?? null,
    });
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
export async function insertTournament(req, res, next) {
  const { id, name, year = new Date().getFullYear(), active, ended } = req.body;
  const data = {
    name,
    year,
    active: active === "on" ? 1 : 0,
    ended: ended === "on" ? 1 : 0,
  };

  const sqlInsert = `
    INSERT INTO open (name, year, active, ended) VALUES (?, ?, ?, ?)
    RETURNING id;
  `;
  const sqlUpdate = `
    UPDATE open SET name = ?, year = ?, active = ?, ended = ? WHERE id = ?
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

    // optional: call next() if you treat this as middleware
    if (next) next();

    res.status(200).send({ message: "Turnaus tallennettu.", id: rows[0]?.id });
  } catch (error) {
    console.error("Virhe turnauksen lisäyksessä/päivityksessä:", error);
    res.status(500).send({ error: "Turnauksen tallennus epäonnistui." });
  }
}

/* -------------------------------------------------
   3️⃣ Player – create / update
---------------------------------------------------*/
export async function insertPlayer(req, res, next) {
  const { id, name, group, points } = req.body;
  const sqlInsert = `
    INSERT INTO player (name, "group", points) VALUES (?, ?, ?)
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

    if (next) next();
    res.status(200).send({ message: "Pelaaja tallennettu.", id: rows[0]?.id });
  } catch (error) {
    console.error("Virhe pelaajan lisäyksessä/päivityksessä:", error);
    res.status(500).send({ error: "Pelaajan tallennus epäonnistui." });
  }
}

/* -------------------------------------------------
   4️⃣ Match – create / update (with factor logic)
---------------------------------------------------*/
export async function insertMatch(req, res) {
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

  // Helper to fetch a player row (used for group comparison)
  const getPlayer = async (playerId) => {
    const rows = await run(`SELECT * FROM player WHERE id = ?`, [playerId]);
    return rows[0];
  };

  try {
    // Run everything in a transaction – we read two players and then write the match.
    const matchRow = await transaction(async (tx) => {
      const homePlayer = await tx.execute(`SELECT * FROM player WHERE id = ?`, [
        home,
      ]);
      const awayPlayer = await tx.execute(`SELECT * FROM player WHERE id = ?`, [
        away,
      ]);

      if (!homePlayer.rows.length || !awayPlayer.rows.length) {
        throw new Error("Pelaajia ei löytynyt ottelua varten.");
      }

      const hp = homePlayer.rows[0];
      const ap = awayPlayer.rows[0];

      // ----- factor calculation (unchanged) -----
      let modifier = 1;
      if (homeWins > awayWins) {
        modifier =
          hp.group <= ap.group ? 1 : hp.group - ap.group === 1 ? 1.5 : 2;
      } else if (awayWins > homeWins) {
        modifier =
          ap.group <= hp.group ? 1 : ap.group - hp.group === 1 ? 1.5 : 2;
      }

      const data = {
        home,
        away,
        homeWins,
        awayWins,
        date,
        result,
        openId,
        reported: reported === "on" ? 1 : 0,
        withdraw: withdraw === "on" ? 1 : 0,
        played: played === "on" ? 1 : 0,
        factor: modifier,
      };

      // Insert or update
      if (id) {
        await tx.execute(
          `UPDATE match
           SET home = ?, away = ?, homeWins = ?, awayWins = ?, date = ?, result = ?, openId = ?, reported = ?, withdraw = ?, played = ?, factor = ?
           WHERE id = ?`,
          [
            data.home,
            data.away,
            data.homeWins,
            data.awayWins,
            data.date,
            data.result,
            data.openId,
            data.reported,
            data.withdraw,
            data.played,
            data.factor,
            id,
          ],
        );
        return { id };
      } else {
        const result = await tx.execute(
          `INSERT INTO match (home, away, homeWins, awayWins, date, result, openId, reported, withdraw, played, factor)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id`,
          [
            data.home,
            data.away,
            data.homeWins,
            data.awayWins,
            data.date,
            data.result,
            data.openId,
            data.reported,
            data.withdraw,
            data.played,
            data.factor,
          ],
        );
        return result.rows[0];
      }
    });

    // Success response
    res.status(200).send({
      message: "Ottelu tallennettu.",
      id: matchRow.id,
    });
  } catch (error) {
    console.error("Virhe ottelun lisäyksessä/päivityksessä:", error);
    res.status(500).send({ error: "Ottelun tallennus epäonnistui." });
  }
}
