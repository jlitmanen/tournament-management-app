const PocketBase = require('pocketbase/cjs');

const url = process.env.POCKETBASE_URL;
const client = new PocketBase(url)


async function fetchContent(req, res, next) {
  res.locals.content = await client.collection('content').getFullList({});
  next();
}

  async function fetchMatches(req, res, next) {
    res.locals.openMatches = await client.collection('quickMatch').getList(1, 7, {
      filter: 'openId="' + req.body.id + '"',
      expand: 'home, away, openId'
    });
    next();
  }
  
  async function fetchResults(req, res, next) {
    res.locals.matches = await client.collection('quickMatch').getFullList({
        sort: '-date',
        expand: 'home, away, openId'
      });
      next();
  }

  async function fetchResultsForAdmin(req, res, next) {
    res.locals.results = await client.collection('match').getFullList({
      expand: 'home, away, openId'
    });
    next();
  }

  async function fetchSingleResult(req, res, next) {
    res.locals.result = await client.collection('match').getOne(req.body.id, {
      expand: 'home, away, openId'
    });
    next();
  }

async function fetchSingleContent(req, res, next) {
  res.locals.content = await client.collection('content').getOne(req.body.id, {});
  next();
}

async function fetchSinglePlayer(req, res, next) {
  res.locals.player = await client.collection('player').getOne(req.body.id, {});
  next();
}
  
  async function fetchRanking(req, res, next) {
    res.locals.players = await client.collection('ranking').getFullList({});
    next();
  }

  async function fetchTournaments(req, res, next) {
    res.locals.opens = await client.collection('open').getFullList({sort: 'created',});
    next();
  }

  async function fetchTournament(req, res, next) {
    res.locals.open = await client.collection('open').getOne(req.body.id, {expand: 'field, field.home, field.away'});
    next();
  }

  module.exports = { fetchContent, fetchTournaments, fetchTournament, fetchMatches, fetchRanking, fetchResults, fetchResultsForAdmin, fetchSingleResult, fetchSinglePlayer, fetchSingleContent }