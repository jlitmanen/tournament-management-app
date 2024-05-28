const PocketBase = require('pocketbase/cjs');

const url = 'https://eye-sister.pockethost.io/'
const client = new PocketBase(url)


async function fetchContent(req, res, next) {
  const records = await client.collection('content').getFullList({

  });
  res.locals.content = records;
  next();
}

  async function fetchMatches(req, res, next) {
    const records = await client.collection('quickMatch').getList(1,7, {filter: 'openId="'+ req.body.open +'"'});
    res.locals.openMatches = records;
    next();
  }
  
  async function fetchResults(req, res, next) {
    const records = await client.collection('quickMatch').getFullList({sort: '-date'});
      res.locals.matches = records;
      next();
  }

  async function fetchResultsForAdmin(req, res, next) {
    const records = await client.collection('match').getFullList({
    });
    res.locals.results = records;
    next();
  }
  
  async function fetchRanking(req, res, next) {
    const records = await client.collection('ranking').getFullList({});
    res.locals.players = records;
    next();
  }

  async function fetchTournaments(req, res, next) {
    const records = await client.collection('open').getFullList({sort: 'created',});
    res.locals.opens = records;
    next();
  }

  async function fetchTournament(req, res, next) {
    const record = await client.collection('open').getOne(req.body.open, {});
    res.locals.open = record;
    next();
  }

  module.exports = { fetchContent, fetchTournaments, fetchTournament, fetchMatches, fetchRanking, fetchResults, fetchResultsForAdmin}