const express = require('express');
const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

const { ranking, player, players } = require("../../database/query");
const { insertPlayer } = require("../../database/insert");

router.get('/ranking', ensureLoggedIn, players, (req, res) => {
    res.render('admin/ranking/ranking', { players: res.locals.players });
});

router.post('/ranking/edit', ensureLoggedIn, player, (req, res) => {
    res.render('admin/ranking/editplayer', { player: res.locals.player });
});

router.post('/ranking/add', ensureLoggedIn, (req, res) => {
    res.render('admin/ranking/editplayer', { player: null });
});

router.post('/ranking', ensureLoggedIn, async (req, res) => {
    try {
        await insertPlayer(req);
        res.redirect('/admin/ranking'); // Ohjaa ranking-listaukseen.
    } catch (error) {
        console.error("Virhe pelaajan lisäyksessä:", error);
        res.status(500).send("Pelaajan lisäys epäonnistui.");
    }
});

module.exports = router;
