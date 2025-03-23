const express = require('express');
const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

const { matches, match, ranking, tournaments } = require("../../database/query");
const { insertMatch } = require("../../database/insert");

router.get('/results', ensureLoggedIn, matches, (req, res) => {
    res.locals.filter = null;
    res.render('admin/match/results', { results: res.locals.results, layout: 'layouts/main' });
});

router.post('/result/edit', ensureLoggedIn, match, ranking, tournaments, (req, res) => {
    res.locals.filter = null;
    res.render('admin/match/editmatch', { result: res.locals.result, player: res.locals.players, opens: res.locals.opens, layout: 'layouts/main' });
});

router.post('/result/add', ensureLoggedIn, ranking, tournaments, (req, res) => {
    res.locals.filter = null;
    res.render('admin/match/editmatch', { result: null, player: res.locals.players, opens: res.locals.opens, layout: 'layouts/main' });
});

router.post('/result', ensureLoggedIn, async (req, res) => {
    try {
        await insertMatch(req);
        res.redirect('/admin/match/results');
    } catch (error) {
        console.error("Virhe ottelun lisäyksessä:", error);
        res.status(500).send("Ottelun lisäys epäonnistui.");
    }
});

module.exports = router;