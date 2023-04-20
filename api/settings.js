const db = require("../lib/dbpromise");

module.exports = async function(req, res) {
  var { user } = req.session;
  var settings = await db.get("SELECT * FROM userSettings WHERE userID = ?", user.id);
  
  if (!settings) {
    await db.run("INSERT INTO userSettings(userID) values(?)", user.id);
  }

  settings = await db.get("SELECT * FROM userSettings WHERE userID = ?", user.id);
  res.json(settings);
}
