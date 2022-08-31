const db = require("../lib/dbpromise");
const fetch = require('node-fetch');
const generic = require('../bakalariStalkin/util/generic.js');

module.exports = async function(req, res) {
  var { user } = req.session;
  var activeSubs = await db.all("SELECT * FROM subscriptions WHERE userID = ?", user.id);
  activeSubs.map(sub => {sub.className = generic.getClassInfo(sub.classID, false, sub.bakaServer).name;});
  res.json(activeSubs);
}
