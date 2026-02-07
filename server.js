import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@libsql/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key";
const app = express();
const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());

// --- LOGIN ROUTE ---q
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Find user in Turso
    const rs = await db.execute({
      sql: "SELECT * FROM users WHERE username = ? AND enabled = 1",
      args: [username],
    });

    const user = rs.rows[0];

    // 2. Verify user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res
        .status(401)
        .json({ error: "Virheellinen käyttäjätunnus tai salasana" });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Kirjautuminen epäonnistui" });
  }
});

// --- MIDDLEWARE TO PROTECT ROUTES ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Add this route near your login route
// authenticateToken is the middleware we created earlier
app.get("/api/auth/status", authenticateToken, (req, res) => {
  // If the code reaches here, the token is valid
  res.json({
    authenticated: true,
    user: req.user, // req.user was set by the middleware
  });
});

// --- VIEWS (Calculated Data) ---
app.get("/api/ranking", async (req, res) => {
  const rs = await db.execute("SELECT * FROM ranking");
  res.json(rs.rows);
});

app.get("/api/ktp-final-rank", async (req, res) => {
  const rs = await db.execute("SELECT * FROM ktp_final_rank");
  res.json(rs.rows);
});

// --- PLAYER CRUD ---
app.get("/api/players", async (req, res) => {
  const rs = await db.execute("SELECT * FROM player ORDER BY name ASC");
  res.json(rs.rows);
});

app.post("/api/players", async (req, res) => {
  const { name, player_group, ranking_points } = req.body;
  await db.execute({
    sql: "INSERT INTO player (name, player_group, ranking_points) VALUES (?, ?, ?)",
    args: [name, player_group || 1, ranking_points || 0],
  });
  res.sendStatus(201);
});

app.put("/api/players/:id", async (req, res) => {
  const { name, player_group, ranking_points } = req.body;
  await db.execute({
    sql: "UPDATE player SET name = ?, player_group = ?, ranking_points = ? WHERE id = ?",
    args: [name, player_group, ranking_points, req.params.id],
  });
  res.sendStatus(200);
});

app.delete("/api/players/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM player WHERE id = ?",
    args: [req.params.id],
  });
  res.sendStatus(200);
});

// --- MATCH CRUD (Updated with Player Filter) ---
app.get("/api/results", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const playerId = req.query.playerId; // Get playerId from query params
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Build the dynamic WHERE clause
    let whereClause = "";
    let args = [];

    if (playerId) {
      whereClause = "WHERE (m.player1 = ? OR m.player2 = ?)";
      args = [playerId, playerId];
    }

    // 2. Get total count for pagination (with filter)
    const countRs = await db.execute({
      sql: `SELECT COUNT(*) as total FROM matches m ${whereClause}`,
      args: args
    });

    // 3. Get matches (with filter)
    const matchesArgs = [...args, limit, offset];
    const rs = await db.execute({
      sql: `SELECT m.*, p1.name as homename, p2.name as awayname, t.name as tournament_name
            FROM matches m
            LEFT JOIN player p1 ON m.player1 = p1.id
            LEFT JOIN player p2 ON m.player2 = p2.id
            LEFT JOIN tournament t ON m.tournament_id = t.id
            ${whereClause}
            ORDER BY m.game_date DESC LIMIT ? OFFSET ?`,
      args: matchesArgs,
    });

    res.json({
      items: rs.rows,
      totalPages: Math.ceil(Number(countRs.rows[0].total) / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Virhe tulosten haussa" });
  }
});

app.post("/api/matches", async (req, res) => {
  const { player1, player2, wins1, wins2, game_date, result, tournament_id } =
    req.body;
  await db.execute({
    sql: "INSERT INTO matches (player1, player2, wins1, wins2, game_date, result, tournament_id, played, reported) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)",
    args: [
      player1,
      player2,
      wins1,
      wins2,
      game_date,
      result,
      tournament_id || null,
    ],
  });
  res.sendStatus(201);
});

app.put("/api/matches/:id", async (req, res) => {
  const { player1, player2, wins1, wins2, game_date, result, tournament_id } =
    req.body;
  await db.execute({
    sql: "UPDATE matches SET player1=?, player2=?, wins1=?, wins2=?, game_date=?, result=?, tournament_id=? WHERE id=?",
    args: [
      player1,
      player2,
      wins1,
      wins2,
      game_date,
      result,
      tournament_id || null,""
      req.params.id,
    ],
  });
  res.sendStatus(200);
});

app.delete("/api/matches/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM matches WHERE id = ?",
    args: [req.params.id],
  });
  res.sendStatus(200);
});

// --- TOURNAMENT (OPENS) CRUD ---
app.get("/api/opens", async (req, res) => {
  const rs = await db.execute("SELECT * FROM tournament ORDER BY year DESC");
  res.json(rs.rows);
});

app.post("/api/opens", async (req, res) => {
  const { name, year, active } = req.body;
  await db.execute({
    sql: "INSERT INTO tournament (name, year, active) VALUES (?, ?, ?)",
    args: [name, year, active ? 1 : 0],
  });
  res.sendStatus(201);
});

app.delete("/api/opens/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM tournament WHERE id = ?",
    args: [req.params.id],
  });
  res.sendStatus(200);
});

app.get("/api/opens/:id/matches", async (req, res) => {
  try {
    // 1. Get the tournament details
    const tournamentRs = await db.execute({
      sql: "SELECT * FROM tournament WHERE id = ?",
      args: [req.params.id],
    });

    // 2. Get the matches
    const matchesRs = await db.execute({
      sql: `SELECT m.*, p1.name as home, p2.name as away
            FROM matches m
            LEFT JOIN player p1 ON m.player1 = p1.id
            LEFT JOIN player p2 ON m.player2 = p2.id
            WHERE m.tournament_id = ?
            ORDER BY m.id ASC`, // Use ID or a specific order for the bracket logic
      args: [req.params.id],
    });

    // 3. Return as the object the frontend expects
    res.json({
      tournament: tournamentRs.rows[0],
      matches: matchesRs.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Virhe haettaessa tietoja" });
  }
});

// --- CONTENT CRUD ---
app.get("/api/content", async (req, res) => {
  const rs = await db.execute("SELECT * FROM content");
  res.json(rs.rows);
});

app.put("/api/content/:id", async (req, res) => {
  const { title, text } = req.body;
  await db.execute({
    sql: "UPDATE content SET title = ?, text = ? WHERE id = ?",
    args: [title, text, req.params.id],
  });
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Tennis API running on port ${PORT}`));
