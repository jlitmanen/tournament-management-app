const express = require("express");
const ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

const { content, contents } = require("../../database/query");
const { insertContent } = require("../../database/insert");

router.get("/about", ensureLoggedIn, contents, (req, res) => {
  res.locals.filter = null;
  res.render("admin/content/about", { content: res.locals.content });
});

router.post("/about/edit", ensureLoggedIn, content, (req, res) => {
  res.locals.filter = null;
  res.render("admin/content/editcontent", { content: res.locals.content });
});

router.post("/about/add", ensureLoggedIn, (req, res) => {
  res.locals.filter = null;
  res.render("admin/content/editcontent", { content: null });
});

router.post("/about", ensureLoggedIn, async (req, res) => {
  try {
    await insertContent(req, res);
    res.redirect("/admin/content/about");
  } catch (error) {
    console.error("Virhe lisättäessä sisältöä:", error);
    res.status(500).send("Sisällön lisäys epäonnistui.");
  }
});
module.exports = router;
