const db = require("../lib/dbpromise");

module.exports = async function (req, res) {
  var { user } = req.session;
  var settings = await db.get(
    "SELECT * FROM userSettings WHERE userID = ?",
    user.id
  );

  if (!settings) {
    await db.run("INSERT INTO userSettings(userID) values(?)", user.id);
  }

  settings = await db.get(
    "SELECT * FROM userSettings WHERE userID = ?",
    user.id
  );
  try {
    settings.groups = JSON.parse(settings.groups);
    res.json({
      settings: settings,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      error: "E_UNKNOWN_ERROR",
      message: "Unexpected error occured",
    });
  }
};
