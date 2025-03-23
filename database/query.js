const PocketBase = require('pocketbase/cjs');

const url = process.env.POCKETBASE_URL;
const client = new PocketBase(url)

/**
 * fetch content / contents
 */
async function content(req, res, next) {
  res.locals.content = await client.collection('content').getOne(req.body.id, {});
  next();
}

async function contents(req, res, next) {
  res.locals.content = await client.collection('content').getFullList({});
  next();
}

/**
 * fetch quickmatch (view) / match (table, updatable)
 */

async function quickmatch(req, res, next) {
  res.locals.openMatches = await client.collection('quickMatch').getList(1, 7, {
    filter: 'openId="' + req.body.id + '"',
    expand: 'home, away, openId'
  });
  next();
}

async function quickmatchpaged(req, res, next) {
  let page = req.params.page;
  let matches = await client.collection('quickMatch').getList(page, 10, {
    sort: '-truedate',
    expand: 'home, away, openId',
    filter: 'home.name ~ ' + req.query.name + " || " + 'away.name ~ ' + req.query.name
  });
  res.locals.count = matches.totalItems;
  res.locals.matches = matches;
  next();
}

async function match(req, res, next) {
  res.locals.result = await client.collection('match').getOne(req.body.id, {
    expand: 'home, away, openId'
  });
  next();
}

async function matches(req, res, next) {
  res.locals.results = await client.collection('match').getFullList({
    expand: 'home, away, openId'
  });
  next();
}

/**
 * fetch player / ranking ( from points-view )
 */

async function player(req, res, next) {
  res.locals.player = await client.collection('player').getOne(req.body.id, {});
  next();
}
  
async function ranking(req, res, next) {
  res.locals.players = await client.collection('points').getFullList({ expand: 'home, away '});
  next();
}

/**
* fetch: open / opens
*/
async function tournaments(req, res, next) {
  res.locals.opens = await client.collection('open').getFullList({sort: 'created',});
  next();
}

async function tournament(req, res, next) {
  res.locals.open = await client.collection('open').getOne(req.body.id, {expand: 'field'});
  res.locals.openMatches = await client.collection('match').getFullList({filter: 'openId="' + req.body.id + '"', expand: 'home, away'});
  next();
}

module.exports = { contents, tournaments, tournament, quickmatch, ranking, quickmatchpaged, matches, match, player, content }