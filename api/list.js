const db = require("../lib/dbpromise");
const fetch = require('node-fetch');

module.exports = async function(req, res) {
  var { user } = req.session;
  var activeSubs = await db.all("SELECT className, groups, pausedUntil, label FROM subscriptions WHERE userID = ?", user.id);
  res.json(activeSubs);
}
