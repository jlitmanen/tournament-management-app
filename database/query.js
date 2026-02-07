const { run, transaction } = require("./db.js");

/**
 * Logic for the content management
 */
async function content(req, res, next) {
  const { id } = req.body;
  const rows = await run(`SELECT * FROM content WHERE id = ?`, [id]);
  res.locals.content = rows[0] || null;
  next();
}

async function contents(req, res, next) {
  const rows = await run(`SELECT * FROM content`);
  res.locals.content = rows;
  next();
}

/**
 * Fetches all matches for a specific tournament.
 * Used for tournament-specific displays and the Admin Modal.
 */
async function quickmatch(req, res, next) {
  const { id } = req.body; // tournament_id
  const rows = await run(
    `SELECT m.*,
            h.name as homename,
            a.name as awayname
     FROM matches AS m
     LEFT JOIN player AS h ON m.player1 = h.id
     LEFT JOIN player AS a ON m.player2 = a.id
     WHERE m.tournament_id = ?
     ORDER BY m.game_date ASC, m.id ASC`,
    [id],
  );
  res.locals.openMatches = rows;
  next();
}

/**
 * Paged matches for general results view.
 * Supports filtering by player (PID) or Tournament (TID).
 */
async function quickmatchpaged(req, res, next) {
  const page = parseInt(req.params.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  // Accept both body or query params for flexibility
  const pid = req.body.selectedPid || req.query.pid || "";
  const tid = req.body.tournamentId || req.query.tid || "";

  let filters = [];
  let params = [];

  if (pid) {
    filters.push(`(m.player1 = ? OR m.player2 = ?)`);
    params.push(pid, pid);
  }
  if (tid) {
    filters.push(`m.tournament_id = ?`);
    params.push(tid);
  }

  const filterClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const rows = await run(
    `SELECT m.*,
            h.name as homename,
            a.name as awayname,
            t.name as tournament_name
     FROM matches m
     LEFT JOIN player h ON m.player1 = h.id
     LEFT JOIN player a ON m.player2 = a.id
     LEFT JOIN tournament t ON m.tournament_id = t.id
     ${filterClause}
     ORDER BY m.game_date DESC, m.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const countRows = await run(
    `SELECT COUNT(*) as cnt FROM matches m ${filterClause}`,
    params,
  );
  const totalPages = Math.ceil((countRows[0]?.cnt || 0) / limit);

  res.locals.matches = {
    items: rows,
    totalPages,
  };
  next();
}

/**
 * Fetches a single match by ID
 */
async function match(req, res, next) {
  const { id } = req.body;
  const rows = await run(
    `SELECT m.*,
            h.name as homename,
            a.name as awayname,
            o.name as tournament_name,
            m.game_date as date
     FROM matches AS m
     LEFT JOIN player AS h ON m.player1 = h.id
     LEFT JOIN player AS a ON m.player2 = a.id
     LEFT JOIN tournament AS o ON m.tournament_id = o.id
     WHERE m.id = ?`,
    [id],
  );
  res.locals.result = rows[0] || null;
  next();
}

/**
 * Fetches all matches ordered by date
 */
async function matches(req, res, next) {
  const rows = await run(
    `SELECT m.*,
            h.name as homename,
            a.name as awayname,
            o.name as tournament_name
     FROM matches AS m
     LEFT JOIN player AS h ON m.player1 = h.id
     LEFT JOIN player AS a ON m.player2 = a.id
     LEFT JOIN tournament AS o ON m.tournament_id = o.id
     ORDER BY m.game_date DESC`,
  );
  res.locals.results = rows;
  next();
}

/**
 * Player logic
 */
async function player(req, res, next) {
  const { id } = req.body;
  const rows = await run(`SELECT * FROM player WHERE id = ?`, [id]);
  res.locals.player = rows[0] || null;
  next();
}

async function getPlayerById(id) {
  const rows = await run(`SELECT * FROM player WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function players(req, res, next) {
  const rows = await run(`SELECT * FROM player ORDER BY name ASC`);
  res.locals.players = rows;
  next();
}

async function ranking(req, res, next) {
  const rows = await run(`SELECT * FROM ranking`);
  res.locals.players = rows;
  next();
}

/**
 * Tournament logic
 */
async function tournaments(req, res, next) {
  const rows = await run(
    `SELECT * FROM tournament ORDER BY year DESC, id DESC`,
  );
  res.locals.opens = rows;
  next();
}

async function tournament(req, res, next) {
  const { id } = req.body;

  const openRows = await run(`SELECT * FROM tournament WHERE id = ?`, [id]);
  const open = openRows[0];

  if (!open) {
    return res.status(404).send("Tournament not found");
  }

  const matchRows = await run(
    `SELECT m.*, h.name AS homename, a.name AS awayname
     FROM matches AS m
     LEFT JOIN player AS h ON m.player1 = h.id
     LEFT JOIN player AS a ON m.player2 = a.id
     WHERE m.tournament_id = ?
     ORDER BY m.game_date ASC, m.id ASC`,
    [id],
  );

  res.locals.open = open;
  res.locals.openMatches = matchRows;
  next();
}

/**
 * Create a new match record
 */
async function createMatch(req, res, next) {
  const { openId, player1, player2, date } = req.body;

  try {
    await transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO matches (tournament_id, player1, player2, game_date, played, reported)
         VALUES (?, ?, ?, ?, 0, 0)`,
        [
          openId,
          player1,
          player2,
          date || new Date().toISOString().split("T")[0],
        ],
      );
    });
    res.status(201).send({ message: "Match created" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
}

module.exports = {
  content,
  contents,
  quickmatch,
  quickmatchpaged,
  match,
  matches,
  player,
  getPlayerById,
  players,
  ranking,
  tournaments,
  tournament,
  createMatch,
};
