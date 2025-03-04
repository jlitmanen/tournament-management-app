const express = require('express');
const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const { fetchContent, fetchTournaments, fetchRanking, fetchResultsForAdmin} = require('../database/query.js');
const { insertContent, insertPlayer, insertMatch, insertTournament} = require('../database/insert.js')
const { removeContent } = require('../database/remove.js')
const { fetchResults, fetchSingleResult, fetchSinglePlayer, fetchSingleContent, fetchTournament} = require("../database/query");
const router = express.Router();

/* GET home page. */
router.get('/', ensureLoggedIn, function(req, res, next) {
	next();
}, fetchResultsForAdmin, fetchRanking, fetchTournaments, fetchContent, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin', { 
    results: res.locals.results, 
    players: res.locals.players, 
    opens: res.locals.opens,
    content: res.locals.content,
    layout: 'layouts/main'}
  );
});

router.get('/about', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchContent, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/about', { content: res.locals.content });
});

router.post('/about/edit', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchSingleContent, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/editcontent', { content: res.locals.content,  layout: 'layouts/main' });
});

router.post('/about/add', ensureLoggedIn, function(req, res, next) {
  next();
}, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/editcontent', { content: null, layout: 'layouts/main' });
});


router.post('/about', ensureLoggedIn, function(req, res) {
  insertContent(req, res);
  res.redirect('/admin/about');
});

router.post('/about/delete', ensureLoggedIn, function(req, res) {
  removeContent(req, res);
  res.redirect('/admin');
});

router.get('/results', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchResultsForAdmin, fetchRanking, fetchTournaments, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/results', { results: res.locals.results, players: res.locals.players, opens: res.locals.opens, layout: 'layouts/main' });
});

router.post('/result/edit', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchSingleResult, fetchRanking, fetchTournaments, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/editmatch', { result: res.locals.result, player: res.locals.players, opens: res.locals.opens,  layout: 'layouts/main' });
});

router.post('/result/add', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchRanking, fetchTournaments, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/editmatch', { result: null, player: res.locals.players, opens: res.locals.opens,  layout: 'layouts/main' });
});

router.post('/result', ensureLoggedIn, function(req, res) {
  insertMatch(req);
  res.redirect('/admin/results');
});

router.get('/ranking', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchRanking, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/ranking', { players: res.locals.players, layout: 'layouts/main' });
});

router.post('/ranking/edit', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchSinglePlayer, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/editplayer', { player: res.locals.player });
});

router.post('/ranking/add', ensureLoggedIn, function(req, res, next) {
  next();
}, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/editplayer', { player: null, layout: 'layouts/main' });
});

router.post('/ranking', ensureLoggedIn, function(req, res, next) {
  insertPlayer(req);
  next();
}, fetchRanking, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/ranking', { player: res.locals.player, layout: 'layouts/main' });
});

router.get('/opens', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchTournaments, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/opens', { opens: res.locals.opens, layout: 'layouts/main' });
});

router.post('/opens/edit', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchTournament, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin/editopen', { open: res.locals.open, layout: 'layouts/main' });
});

router.post('/opens', ensureLoggedIn, function(req, res, next) {
  insertTournament(req, res, next);
  res.redirect('/admin');
});


module.exports = router;
