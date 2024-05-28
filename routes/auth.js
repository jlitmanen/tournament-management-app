var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var router = express.Router();

const PocketBase = require('pocketbase/cjs');

const url = 'https://eye-sister.pockethost.io/'
const pb = new PocketBase(url)

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const authData = await pb.collection('users').authWithPassword(
    username,
    password,
  );

  if(!pb.authStore.isValid) { return cb(err); }
  return cb(null, authData);
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login/password', passport.authenticate('local', {
  successReturnToOrRedirect: '/admin',
  failureRedirect: '/login',
  failureMessage: true
}));

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    pb.authStore.clear();
    res.redirect('/');
  });
});

module.exports = router;
