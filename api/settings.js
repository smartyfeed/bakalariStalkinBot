const db = require("../lib/dbpromise");
const generic = require('../bakalariStalkin/util/generic.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');

module.exports = async function(req, res) {
  var { user } = req.session;
  var settings = await db.get("SELECT * FROM userSettings WHERE userID = ?", user.id);
  
  if (!settings) {
    await db.run("INSERT INTO userSettings(userID) values(?)", user.id);
  }

  settings = await db.get("SELECT * FROM userSettings WHERE userID = ?", user.id);
  try {
    res.json({
      settings: settings,
      classes: await updateClassIDs.fetchPairs(settings.bakaServer),
      groups: await generic.getPossibleGroups(settings.className, true, settings.bakaServer)
    });
  } catch(e) {
    console.log(e);
    res.status(400).json({
      error: "E_UNKNOWN_ERROR",
      message: "Unexpected error occured",
    });
  }
}
