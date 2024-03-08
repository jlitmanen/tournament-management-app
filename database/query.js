var db = require('./db');

function fetchContent(req, res, next) {
    db.all('SELECT * FROM content', function(err, rows) {
      if (err) { return next(err); }
      
      var content = rows.map(function(row) {
        return {
          id: row.id,
          title: row.title,
          text: row.text
        }
      });
      res.locals.content = content;
      next();
    });
  }

  var tQuery = "SELECT json_object( " +
    "'id', t.id,  " +
    "'name', t.name, " +
    "'active', t.active, " + 
    "'ended', t.ended,  " +
    "'year', t.year, " +
    "'matches', ( " +
          "SELECT json_group_array( " +
          "json_object( " +
            "'id', m.id,  " +
            "'p1', (SELECT name from player where id = m.player1), " +
            "'p2', (SELECT name from player where id = m.player2), " +
            "'w1', m.wins1, " +
            "'w2', m.wins2 " +
          " )) " +
              "FROM matches m " +
              "WHERE m.tournament_id = t.id)) AS open " +
  "FROM tournament t "
  
  function fetchTournaments(req, res, next) {
    db.all("SELECT * FROM tournament", function(err, rows) {
      if (err) { return next(err); }
      var opens = rows;
      res.locals.opens = opens;
      next();
    });
  }

  function fetchTournament(req, res, next) {
    db.all("SELECT * FROM tournament WHERE id = ?", [req.body.open], function(err, rows) {
      if (err) { return next(err); }
      var open = rows[0];
      res.locals.open = open;
      next();
    });
  }

  function fetchMatches(req, res, next) {
    var query =
    'SELECT id, ' +
    '(SELECT p.name FROM player p WHERE p.id = player1) AS p1, '+
    '(SELECT p.name FROM player p WHERE p.id = player2) AS p2, '+   
    '(SELECT p.id FROM player p WHERE p.id = player1) AS p1id, '+
    '(SELECT p.id FROM player p WHERE p.id = player2) AS p2id, '+
    'wins1, wins2, '+
    'game_date, '+
    'reported, result, played, withdraw, tournament_id '+
    'FROM matches WHERE tournament_id = ?';
    db.all(query,[req.body.open], function(err, rows) {
      if (err) { return next(err); }
      
      var matches = rows.map(function(row) {
        var result = row.result.replace("\\r\\n",'<br />');
        return {
          id: row.id,
          player1: row.p1,
          player2: row.p2,
          p1id: row.p1id,
          p2id: row.p2id,
          wins1: row.wins1,
          wins2: row.wins2,
          date: row.game_date,
          reported: row.reported,
          result: result,
          played: row.played,
          withdraw: row.withdraw,
          tournament: row.tournament_id
        }
      });
      res.locals.matches = matches;
      next();
    });
  }
  
  function fetchTournament(req, res, next) {
    db.all("SELECT * FROM tournament where id = ?",[req.body.open],  function(err, rows) {
      if (err) { return next(err); }
      var open = rows[0];
      res.locals.open = open;
      next();
    });
  }
  
  function fetchResults(req, res, next) {
    var query =
    'SELECT id, ' +
    '(SELECT p.name FROM player p WHERE p.id = player1) AS p1, '+
    '(SELECT p.name FROM player p WHERE p.id = player2) AS p2, '+   
    '(SELECT p.id FROM player p WHERE p.id = player1) AS p1id, '+
    '(SELECT p.id FROM player p WHERE p.id = player2) AS p2id, '+
    'wins1, wins2, '+
    'game_date, '+
    'reported, replace(result, "\\r\\n","") as result, played, withdraw, tournament_id '+
    'FROM matches';
    db.all(query, function(err, rows) {
      if (err) { return next(err); }
      
      var matches = rows.map(function(row) {
        var result = row.result.replace("\r",' ');
        result = row.result.replace("\n", ' ');
        result = row.result.replace("<br />", ' ');
        return {
          id: row.id,
          player1: row.p1,
          player2: row.p2,
          p1id: row.p1id,
          p2id: row.p2id,
          wins1: row.wins1,
          wins2: row.wins2,
          date: row.game_date,
          reported: row.reported,
          result: result,
          played: row.played,
          withdraw: row.withdraw,
          tournament: row.tournament_id
        }
      });
      res.locals.matches = matches;
      next();
    });
  }
  
  function fetchRanking(req, res, next) {
    console.log("AAAAAAAAA");
    var query = 
    'SELECT distinct ' +
      'p.id AS id,' +
      'p.name AS name,' +
      'p.ranking_points AS points, '+
      'p.player_group AS g, '+
      'COUNT(m.id) AS mcount '+
        ' FROM player p ' +
        'JOIN matches m ON m.player1 = p.id OR m.player2 = p.id '+
        'GROUP BY p.id '+
        'ORDER BY p.ranking_points DESC, p.player_group';
    db.all(query, function(err, rows) {
      if (err) { return next(err); }
      
      var players = rows.map(function(row) {
        return {
          id: row.id,
          name: row.name,
          points: row.points,
          group: row.g,
          matches: row.mcount
        }
      });
    
      res.locals.players = players;
      next();
    });
  }

  var fn1 = function(str) {
    alert(str);
  }

  module.exports = { fetchContent, fetchTournaments, fetchTournament, fetchMatches, fetchRanking, fetchResults, fetchTournament}