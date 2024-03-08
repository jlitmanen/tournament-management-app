var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');
var crypto = require('crypto');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/ktp.db');

db.serialize(function() {
  var salt = crypto.randomBytes(16);
  db.run('INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [
    'admin',
    crypto.pbkdf2Sync('isoMUSTAkissa', salt, 310000, 32, 'sha256'),
    salt
  ]);
});

module.exports = db;
