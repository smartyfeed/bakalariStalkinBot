const db = require("../lib/dbpromise");
const generic = require('../bakalariStalkin/util/generic.js');
const util = require('util')

module.exports = async function(req, res) {
  var { user, isAdmin } = req.session;
  const { client } = require('../index');

  if (!isAdmin) {
    return res.status(403).json({
      status: 403,
      error: "E_UNAUTHORIZED",
      message: "You are not authorized to access this",
    });
  }

  var stalkers = {};
  let subs = await db.all("SELECT * FROM subscriptions");

  for (let sub of subs) {
    sub.className = (await generic.getClassInfo(sub.classID, false, sub.bakaServer)).name;
  }

  for (let sub of subs) {
    if (!stalkers[sub.userID]) {
      stalkers[sub.userID] = {};
      stalkers[sub.userID].subs = [];
      stalkers[sub.userID].user = await client.users.fetch(sub.userID);

    }
    sub.groups = JSON.parse(sub.groups);
    stalkers[sub.userID].subs.push(sub);
  }

  res.json({status: 200, stalkers: stalkers});
}
