import { run } from "./db.js";

export async function content(req, res, next) {
  const { id } = req.body;
  const rows = await run(`SELECT * FROM content WHERE id = ?`, [id]);
  res.locals.content = rows[0] || null;
  next();
}

export async function contents(req, res, next) {
  const rows = await run(`SELECT * FROM content`);
  res.locals.content = rows; // array of all rows
  next();
}

export async function quickmatch(req, res, next) {
  const { id } = req.body; // openId we’re filtering on
  const rows = await run(
    `SELECT qm.*,
            h.*,
            a.*
     FROM quickMatch AS qm
     LEFT JOIN player AS h ON qm.home = h.id
     LEFT JOIN player AS a ON qm.away = a.id
     WHERE qm.tournament_id = ?`,
    [id],
  );
  res.locals.openMatches = rows;
  next();
}

export async function quickmatchpaged(req, res, next) {
  const page = parseInt(req.params.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const pid = req.body.selectedPid || "";

  let filterClause = "";
  const params = [];

  if (pid) {
    filterClause = `WHERE qm.home = ? OR qm.away = ?`;
    params.push(pid, pid);
  }

  const rows = await run(
    `SELECT qm.*, h.*, a.*, h.name as homename, a.name as awayname
     FROM quickMatch qm
     LEFT JOIN player h ON qm.home = h.id
     LEFT JOIN player a ON qm.away = a.id
     ${filterClause}
     ORDER BY qm.truedate DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  // Turso does not return total pages automatically; you need a separate count query
  const countRows = await run(
    `SELECT COUNT(*) as cnt FROM quickMatch qm ${filterClause}`,
    pid ? [pid, pid] : [],
  );
  const totalPages = Math.ceil(countRows[0].cnt / limit);

  res.locals.matches = {
    items: rows,
    totalPages,
  };
  next();
}

export async function match(req, res, next) {
  const { id } = req.body;
  const rows = await run(
    `SELECT m.*, h.name as home, a.name as away, o.name as tournament, o.id as openId, m.game_date as date
     FROM matches AS m
     LEFT JOIN player AS h ON m.player1 = h.id
     LEFT JOIN player AS a ON m.player2 = a.id
     LEFT JOIN tournament   AS o ON m.tournament_id = o.id
     WHERE m.id = ?`,
    [id],
  );
  res.locals.result = rows[0] || null;
  next();
}

export async function matches(req, res, next) {
  const rows = await run(
    `SELECT m.*, h.name as home, a.name as away, o.name as tournament
     FROM matches AS m
     LEFT JOIN player AS h ON m.player1 = h.id
     LEFT JOIN player AS a ON m.player2 = a.id
     LEFT JOIN tournament   AS o ON m.tournament_id = o.id
     ORDER BY m.date`,
  );
  res.locals.results = rows;
  next();
}

export async function player(req, res, next) {
  const { id } = req.body;
  const rows = await run(`SELECT * FROM player WHERE id = ?`, [id]);
  res.locals.player = rows[0] || null;
  next();
}

export async function players(req, res, next) {
  const rows = await run(`SELECT * FROM player`);
  res.locals.players = rows;
  next();
}

export async function ranking(req, res, next) {
  const rows = await run(
    `SELECT *
     FROM ranking`,
  );
  res.locals.players = rows;
  next();
}

export async function tournaments(req, res, next) {
  const rows = await run(`SELECT * FROM tournament ORDER BY id DESC`);
  res.locals.opens = rows;
  next();
}

export async function tournament(req, res, next) {
  const { id } = req.body;

  // Fetch the tournament (tournament) itself
  const openRows = await run(`SELECT * FROM tournament WHERE id = ?`, [id]);
  const open = openRows[0];

  if (!open) {
    return res.status(404).send("Tournament not found");
  }

  // Fetch its matches (including home/away expansions)
  const matchRows = await run(
    `SELECT m.*, h.name AS home, a.name AS away
     FROM matches AS m
     LEFT JOIN player AS h ON m.player1 = h.id
     LEFT JOIN player AS a ON m.player2 = a.id
     WHERE m.tournament_id = ?
     ORDER BY
       m.id ASC`,
    [id],
  );

  // Attach to locals
  res.locals.open = open;
  res.locals.openMatches = matchRows;
  next();
}
export async function createMatch(req, res, next) {
  const { openId, homeId, awayId, date } = req.body;

  await transaction(async (tx) => {
    // Insert the matches
    await tx.execute(
      `INSERT INTO matches (id, tournament_id, home_id, away_id, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), openId, homeId, awayId, date],
    );

    // Example side‑effect: increment a counter on the tournament
    await tx.execute(
      `UPDATE open SET match_count = match_count + 1 WHERE id = ?`,
      [openId],
    );
  });

  res.status(201).send("matches created");
}
