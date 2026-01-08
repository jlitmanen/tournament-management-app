const express = require("express");
const ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

const { tournaments, tournament, players } = require("../../database/query");
const { insertTournament, insertMatch } = require("../../database/insert");

router.get("/opens", ensureLoggedIn, tournaments, (req, res) => {
  res.locals.filter = null;
  res.render("admin/open/opens", { opens: res.locals.opens });
});

router.post("/opens/edit", ensureLoggedIn, tournament, players, (req, res) => {
  res.locals.filter = null;
  res.render("admin/open/editopen", {
    open: res.locals.open,
    players: res.locals.players,
    matches: res.locals.openMatches,
  });
});

router.post("/opens", ensureLoggedIn, async (req, res) => {
  try {
    await insertTournament(req, res);
    res.redirect("/admin/opens/opens");
  } catch (error) {
    console.error("Virhe turnauksen lisäyksessä:", error);
    res.status(500).send("Turnauksen lisäys epäonnistui.");
  }
});

router.post("/open/match", ensureLoggedIn, async (req, res) => {
  try {
    await insertMatch(req, res);
    res.redirect("/admin/open"); // Tarkista tämä, ohjaako oikeaan paikkaan.
  } catch (error) {
    console.error("Virhe ottelun lisäyksessä:", error);
    res.status(500).send("Ottelun lisäys epäonnistui.");
  }
});

module.exports = router;
