const express = require('express');
const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const { contents, tournaments, tournament, matches, ranking, players, quickmatchpaged } = require('../database/query.js');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  if (!req.user) {
    return res.render('home');
  } else {
    res.render('index', { user: req.user });
  }
});

router.get('/about', contents, (req, res) => {
  res.render('about', { content: res.locals.content });
});

router.get('/results/:page', quickmatchpaged, players, (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const pid = req.body.selectedPid || ''; // Muutettu oletusarvo tyhjäksi merkkijonoksi

  try {
    res.render('results', {
      results: res.locals.matches,
      players: res.locals.players,
      current: page,
      pages: res.locals.matches.totalPages,
      searchPid: pid // Muutettu pid searchPid:ksi
    });
  } catch (error) {
    console.error("Virhe tulosten haussa:", error);
    res.status(500).send("Tulosten haku epäonnistui.");
  }
});

router.post('/results/:page', quickmatchpaged, players, (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const pid = req.body.selectedPid || ''; // Muutettu oletusarvo tyhjäksi merkkijonoksi

  try {
    res.render('results', {
      results: res.locals.matches,
      players: res.locals.players,
      current: page,
      pages: res.locals.matches.totalPages,
      searchPid: pid // Muutettu pid searchPid:ksi
    });
  } catch (error) {
    console.error("Virhe tulosten haussa:", error);
    res.status(500).send("Tulosten haku epäonnistui.");
  }
});

router.get('/ranking', ranking, (req, res) => {
  res.render('ranking', { players: res.locals.players });
});

router.get('/open', matches, tournaments, (req, res) => {
  res.render('open', { open: null, openMatches: null, opens: res.locals.opens });
});

router.post('/open', tournament, matches, tournaments, (req, res) => {
  // Tarkista, ohjaako tämä oikeaan paikkaan.
  res.render('open', { open: res.locals.open, openMatches: res.locals.openMatches, opens: res.locals.opens });
});

module.exports = router;
