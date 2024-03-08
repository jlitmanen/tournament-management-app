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

router.get('/opens', function(req, res, next) {
	next();
}, fetchTournaments, fetchMatches, function(req, res, next) {
  res.locals.filter = null;
  res.render('opens', { opens: res.locals.opens, matches: res.locals.matches });
});

router.post('/open', function(req, res, next) {
	next();
}, fetchTournament, fetchMatches, function(req, res, next) {
  res.locals.filter = null;
  res.render('open', { open: res.locals.open, matches: res.locals.matches });
});

module.exports = router;
