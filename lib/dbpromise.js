module.exports.run = function(statement, params = []) {
  const index = require("../index");
  const { db } = index;

  return new Promise(function (resolve, reject) {
    db.run(statement, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    })
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
