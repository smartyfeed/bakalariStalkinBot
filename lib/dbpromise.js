module.exports.run = function(statement, params = []) {
  const index = require("../index");
  const { db } = index;

  return new Promise(function(resolve, reject) {
    db.run(statement, params, (err) => err == null ? resolve(err) : reject(err));
  });
}

module.exports.get = function(statement, params = []) {
  const index = require("../index");
  const { db } = index;

  return new Promise(function(resolve, reject) {
    db.get(statement, params, (err, row) => err == null ? resolve(row) : reject(err));
  });
}

module.exports.all = function(statement, params = []) {
  const index = require("../index");
  const { db } = index;

  return new Promise(function(resolve, reject) {
    db.all(statement, params, (err, rows) => err == null ? resolve(rows) : reject(err));
  });
}
