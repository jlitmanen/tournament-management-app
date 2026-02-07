const express = require("express");
const router = express.Router();
const { run } = require("../database/db.js");

const apiAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const {
  contents,
  tournaments,
  tournament,
  ranking,
  players,
  quickmatchpaged,
  player,
  match,
} = require("../database/query.js");

const {
  insertPlayer,
  insertMatch,
  insertTournament,
  insertContent,
} = require("../database/insert.js");

/**
 * Players & Ranking
 */
router.get("/players", players, (req, res) => {
  res.json(res.locals.players);
});

router.get("/ranking", ranking, (req, res) => {
  res.json(res.locals.players);
});

router.get(
  "/players/:id",
  (req, res, next) => {
    req.body.id = req.params.id; // Existing middleware expects ID in body
    next();
  },
  player,
  (req, res) => {
    res.json(res.locals.player);
  },
);

router.post("/players", apiAuthenticated, insertPlayer);

router.put(
  "/players/:id",
  apiAuthenticated,
  (req, res, next) => {
    req.body.id = req.params.id;
    next();
  },
  insertPlayer,
);

router.delete("/players/:id", apiAuthenticated, async (req, res) => {
  try {
    await run(`DELETE FROM player WHERE id = ?`, [req.params.id]);
    res.json({ message: "Pelaaja poistettu" });
  } catch (err) {
    res.status(500).json({ error: "Poisto epäonnistui" });
  }
});

/**
 * Matches / Results
 */
router.get(
  "/results",
  (req, res, next) => {
    // quickmatchpaged expects page in params and selectedPid in body
    req.params.page = req.query.page || 1;
    req.body.selectedPid = req.query.playerId || "";
    next();
  },
  quickmatchpaged,
  (req, res) => {
    res.json(res.locals.matches);
  },
);

router.get(
  "/matches/:id",
  (req, res, next) => {
    req.body.id = req.params.id;
    next();
  },
  match,
  (req, res) => {
    res.json(res.locals.result);
  },
);

router.post("/matches", apiAuthenticated, insertMatch);

router.put(
  "/matches/:id",
  apiAuthenticated,
  (req, res, next) => {
    req.body.id = req.params.id;
    next();
  },
  insertMatch,
);

router.delete("/matches/:id", apiAuthenticated, async (req, res) => {
  try {
    await run(`DELETE FROM matches WHERE id = ?`, [req.params.id]);
    res.json({ message: "Ottelu poistettu" });
  } catch (err) {
    res.status(500).json({ error: "Poisto epäonnistui" });
  }
});

/**
 * Tournaments (Opens)
 */
router.get("/opens", tournaments, (req, res) => {
  res.json(res.locals.opens);
});

router.get(
  "/opens/:id/matches",
  (req, res, next) => {
    req.body.id = req.params.id;
    next();
  },
  tournament,
  (req, res) => {
    res.json({
      tournament: res.locals.open,
      matches: res.locals.openMatches,
    });
  },
);

router.post("/opens", apiAuthenticated, insertTournament);

router.put(
  "/opens/:id",
  apiAuthenticated,
  (req, res, next) => {
    req.body.id = req.params.id;
    next();
  },
  insertTournament,
);

router.delete("/opens/:id", apiAuthenticated, async (req, res) => {
  try {
    await run(`DELETE FROM tournament WHERE id = ?`, [req.params.id]);
    res.json({ message: "Turnaus poistettu" });
  } catch (err) {
    res.status(500).json({ error: "Poisto epäonnistui" });
  }
});

/**
 * Content (About page)
 */
router.get("/content", contents, (req, res) => {
  res.json(res.locals.content);
});

router.post("/content", apiAuthenticated, insertContent);

router.put(
  "/content/:id",
  apiAuthenticated,
  (req, res, next) => {
    req.body.id = req.params.id;
    next();
  },
  insertContent,
);

router.delete("/content/:id", apiAuthenticated, async (req, res) => {
  try {
    await run(`DELETE FROM content WHERE id = ?`, [req.params.id]);
    res.json({ message: "Sisältö poistettu" });
  } catch (err) {
    res.status(500).json({ error: "Poisto epäonnistui" });
  }
});

/**
 * Auth Status
 */
router.get("/auth/status", (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null,
  });
});

module.exports = router;
