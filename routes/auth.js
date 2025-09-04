const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const router = express.Router();

const PocketBase = require("pocketbase/cjs");

const url = process.env.POCKETBASE_URL;
const pb = new PocketBase(url);

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(username, password);

      if (!pb.authStore.isValid) {
        return cb(new Error("Invalid username or password"));
      }
      return cb(null, authData);
    } catch (error) {
      return cb(error);
    }
  }),
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post(
  "/login/password",
  passport.authenticate("local", {
    successReturnToOrRedirect: "/admin",
    failureRedirect: "/login",
    failureMessage: true,
  }),
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    pb.authStore.clear();
    res.redirect("/");
  });
});

module.exports = router;
