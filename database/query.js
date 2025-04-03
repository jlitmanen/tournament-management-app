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

const quickmatchpaged = async (req, res, next) => {
  const page = parseInt(req.params.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const pid = req.query.pid || '';

  try {
    let filter = '';
    if (pid) {
      filter = `home.id = "${pid}" || away.id = "${pid}"`;
    }


    const matches = await client.collection('quickMatch').getList(page, limit, {
      sort: '-truedate',
      expand: 'home, away, openId',
      filter: filter || 'id != null', // Käytetään undefined, jos suodatin on tyhjä
    });

    res.locals.matches = { items: matches.items, totalPages: matches.totalPages };
    next();
  } catch (error) {
    console.error("Virhe otteluiden haussa:", error);
    res.status(500).send("Otteluiden haku epäonnistui.");
  }
};

async function match(req, res, next) {
  res.locals.result = await client.collection('match').getOne(req.body.id, {
    expand: 'home, away, openId'
  });
  next();
}

async function matches(req, res, next) {
  res.locals.results = await client.collection('match').getFullList({
    expand: 'home, away, openId',
    sort: 'date'
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

async function players(req, res, next) {
  res.locals.players = await client.collection('player').getFullList({});
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

module.exports = { contents, tournaments, tournament, quickmatch, ranking, quickmatchpaged, matches, match, player, players, content }