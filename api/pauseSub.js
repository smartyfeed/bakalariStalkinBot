const db = require("../lib/dbpromise");

module.exports = async function (req, res) {
  var { user } = req.session;
  let date = new Date(req.body.until);

  if (req.body.unpause) {
    if (req.body.id == "all") {
      await db.run("UPDATE subscriptions SET pausedUntil = 0 WHERE userID = ?", [user.id]);
    } else {
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

      await db.run("UPDATE subscriptions SET pausedUntil = 0 WHERE id = ?", [req.body.id]);
    }

    return res.status(200).json({
      message: "OK",
    });
  }

  if (req.body.id == "all") {
    await db.run("UPDATE subscriptions SET pausedUntil = ? WHERE userID = ?", [date.getTime(), user.id]);
  } else {
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

    await db.run("UPDATE subscriptions SET pausedUntil = ? WHERE id = ?", [date.getTime(), req.body.id]);
  }

  return res.status(200).json({
    message: "OK",
  });
};
