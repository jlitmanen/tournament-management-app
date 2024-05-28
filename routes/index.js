var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();
const {fetchContent, fetchTournaments, fetchTournament, fetchMatches, fetchRanking, fetchResults} = require('../database/query.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  else { res.render('index', { user: req.user }); }
});

router.get('/about', function(req, res, next) {
  next();
}, fetchContent, function(req, res, next) {
  res.locals.filter = null;
  res.render('about', { content: res.locals.content });
});

router.get('/results', function(req, res, next) {
	next();
}, fetchResults, function(req, res, next) {
  res.locals.filter = null;
  res.render('results', { results: res.locals.matches });
});

router.get('/ranking', function(req, res, next) {
	next();
}, fetchRanking, function(req, res, next) {
  res.locals.filter = null;
  res.render('ranking', { players: res.locals.players });
});

router.get('/open', function(req, res, next) {
	next();
}, fetchMatches, fetchTournaments, function(req, res, next) {
  res.locals.filter = null;
  res.render('open', { open: null, openMatches: null, opens: res.locals.opens });
});

router.post('/open', function(req, res, next) {
	next();
}, fetchTournament, fetchMatches, fetchTournaments, function(req, res, next) {
  res.locals.filter = null;
  res.render('open', { open: res.locals.open, openMatches: res.locals.openMatches, opens: res.locals.opens });
});

module.exports = router;
