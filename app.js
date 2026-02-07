const createError = require("http-errors");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const lusca = require("lusca");
const passport = require("passport");
const logger = require("morgan");

const MemoryStore = require("memorystore")(session);

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const openRouter = require("./routes/admin/open");
const aboutRouter = require("./routes/admin/about");
const apiRouter = require("./routes/api");

const matchRouter = require("./routes/admin/match");
const rankingRouter = require("./routes/admin/ranking");

const app = express();

// view engine setup
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("layout", "./layouts/main");
app.set("views", path.join(__dirname, "views"));

app.locals.pluralize = require("pluralize");

app.use(logger("tiny", { stream: process.stdout }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
      expired: {
        clear: true,
        intervalMs: 900000, //ms = 15min
      },
    }),
    resave: false,
    secret: "keyboard cat",
    saveUninitialized: false,
    unset: "destroy",
  }),
);
app.use(function (req, res, next) {
  if (
    req.path.startsWith("/api") ||
    req.path === "/login" ||
    req.path === "/logout"
  ) {
    return next();
  }
  lusca.csrf()(req, res, next);
});
app.use(passport.authenticate("session"));
app.use(function (req, res, next) {
  const msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;
  req.session.messages = [];
  next();
});
app.use(function (req, res, next) {
  res.locals.csrfToken =
    typeof req.csrfToken === "function" ? req.csrfToken() : "";
  next();
});

app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

app.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.logIn(user, function (err) {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      return res.json({
        isAuthenticated: true,
        user: { id: user.id, username: user.username },
      });
    });
  })(req, res, next);
});

app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ isAuthenticated: false });
  });
});

app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/admin", adminRouter);
app.use("/admin", aboutRouter);
app.use("/admin", matchRouter);
app.use("/admin", openRouter);
app.use("/admin", rankingRouter);
app.use("/api", apiRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
