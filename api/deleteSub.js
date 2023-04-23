const db = require("../lib/dbpromise");

module.exports = async function (req, res) {
  var { user } = req.session;

  var sub = await db.get(
    "SELECT * FROM subscriptions WHERE userID = ? AND id = ?",
    [user.id, req.body.id]
  );

  if (!sub) {
    return res.status(400).json({
      error: "E_BAD_SUBSCRIPTION_ID",
      message: "Provided subscription ID is not valid",
    });
  }

  await db.run("DELETE FROM subscriptions WHERE id = ?", [req.body.id]);

  return res.status(200).json({
    message: "OK",
  });
};
