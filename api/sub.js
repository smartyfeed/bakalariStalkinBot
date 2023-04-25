const db = require("../lib/dbpromise");
const generic = require('../bakalariStalkin/util/generic.js');

module.exports = async function (req, res) {
  var { user } = req.session;

  console.log(user);
  console.log(req.body);
  var sub = await db.get(
    "SELECT * FROM subscriptions WHERE userID = ? AND id = ?",
    [user.id,
    req.body.id]
  );

  if (!sub) {
    return res.status(400).json({
      error: "E_BAD_SUBSCRIPTION_ID",
      message: "Provided subscription ID is not valid",
    });
  }
  
  sub.groups = JSON.parse(sub.groups);

  sub.className = (await generic.getClassInfo(sub.classID, false, sub.bakaServer)).name;
  
  console.log(sub);


  return res.status(200).json({
    sub: sub,
  });
};
