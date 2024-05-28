const createError = require('http-errors');
const express = require('express');
const expressLayouts = require('express-ejs-layouts')
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const passport = require('passport');
const logger = require('morgan');

// pass the session to the connect sqlite3 module
// allowing it to inherit from session.Store
var SQLiteStore = require('connect-sqlite3')(session);

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.use(expressLayouts)
app.set('view engine', 'ejs');
app.set('layout', './layouts/main')
app.set('views', path.join(__dirname, 'views'));


app.locals.pluralize = require('pluralize');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));
app.use(csrf());
app.use(passport.authenticate('session'));
app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});
app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
