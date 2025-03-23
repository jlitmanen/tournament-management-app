const express = require('express');
const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

/* GET home page. */
router.get('/', ensureLoggedIn,
  function(req, res, next) {
    res.locals.filter = null;
    res.render('admin', { layout: 'layouts/main' }
  );
});

module.exports = router;
