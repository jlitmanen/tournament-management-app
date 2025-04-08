const createError = require('http-errors');
const express = require('express');
const expressLayouts = require('express-ejs-layouts')
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const lusca = require('lusca');
const passport = require('passport');
const logger = require('morgan');
const sqlite = require("better-sqlite3");

// pass the session to the connect sqlite3 module
// allowing it to inherit from session.Store
const SqliteStore = require("better-sqlite3-session-store")(session)
const db = new sqlite(process.env.RAILWAY_VOLUME_MOUNT_PATH + "/sessions.db");

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const openRouter = require('./routes/admin/open');
const aboutRouter = require('./routes/admin/about');

const matchRouter = require('./routes/admin/match');
const rankingRouter = require('./routes/admin/ranking');


const app = express();

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
  cookie: { maxAge: 86400000 },
  store: new SqliteStore({
    client: db, 
    expired: {
      clear: true,
      intervalMs: 900000 //ms = 15min
    }
  }),
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  secret: process.env.COOKIE_SECRET
}));

app.use(lusca.csrf());
app.use(passport.authenticate('session'));
app.use(function(req, res, next) {
  const msgs = req.session.messages || [];
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
app.use('/admin', aboutRouter);
app.use('/admin', matchRouter);
app.use('/admin', openRouter);
app.use('/admin', rankingRouter);

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
