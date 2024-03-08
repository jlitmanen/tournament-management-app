var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ensureLoggedIn = ensureLogIn();
const {fetchContent, fetchTournaments, fetchRanking, fetchResults, fetchTournament} = require('../database/query.js');
const {insertContent, insertPlayer, insertMatch, insertTournament} = require('../database/insert.js')
var router = express.Router();

/* GET home page. */
router.get('/', ensureLoggedIn, function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  else { res.render('admin', { layout: 'layouts/admin.ejs' }); }
});

router.get('/about', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchContent, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin_about', { content: res.locals.content, layout: 'layouts/admin.ejs' });
});

router.post('/about', ensureLoggedIn, function(req, res) {
  insertContent(req, res);
  res.redirect('/admin/about');
});

router.get('/results', ensureLoggedIn, function(req, res, next) {
	next();
}, fetchResults, fetchRanking, fetchTournaments, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin_results', { 
    results: res.locals.matches, 
    players: res.locals.players, 
    opens: res.locals.opens,
    layout: 'layouts/admin.ejs'  });
});

router.post('/results', ensureLoggedIn, function(req, res) {
  insertMatch(req, res);
  res.redirect('/admin/results');
});

router.get('/ranking', ensureLoggedIn, function(req, res, next) {
	next();
}, fetchRanking, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin_ranking', { players: res.locals.players, layout: 'layouts/admin.ejs'  });
});

router.post('/ranking', ensureLoggedIn, function(req, res) {
  insertPlayer(req, res);
  res.render('admin_ranking', { players: res.locals.players, layout: 'layouts/admin.ejs'  });
});

router.get('/opens', ensureLoggedIn, function(req, res, next) {
  next();
}, fetchTournaments, function(req, res, next) {
	res.locals.filter = null;
	res.render('admin_opens', { opens: res.locals.opens, layout: 'layouts/admin.ejs'});
});

router.post('/opens', ensureLoggedIn, function(req, res, next) {
  insertTournament(req, res, next);
  next;
}, fetchResults, fetchRanking, fetchTournament, function(req, res, next) {
  res.locals.filter = null;
  res.render('admin_opens', { 
    results: res.locals.matches, 
    players: res.locals.players, 
    open: res.locals.open,
    layout: 'layouts/admin.ejs'  });
});

module.exports = router;
