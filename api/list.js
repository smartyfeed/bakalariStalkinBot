const db = require("../lib/dbpromise");
const fetch = require('node-fetch');
const generic = require('../bakalariStalkin/util/generic.js');

module.exports = async function(req, res) {
  var { user } = req.session;
  var activeSubs = await db.all("SELECT * FROM subscriptions WHERE userID = ?", user.id);
  for (let sub of activeSubs) {
    sub.className = (await generic.getClassInfo(sub.classID, false, sub.bakaServer)).name;
  }

  activeSubs.sort((a,b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))
  res.json(activeSubs);
}
