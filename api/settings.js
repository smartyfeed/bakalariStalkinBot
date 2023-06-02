const db = require('../lib/dbpromise');

module.exports = async function(req, res) {
  const { user } = req.session;
  let settings = await db.get(
    'SELECT * FROM userSettings WHERE userID = ? AND platform = ?',
    [user.id, user.platform],
  );

  if (!settings) {
    await db.run('INSERT INTO userSettings(userID, platform) values(?, ?)', [user.id, user.platform]);
  }

  settings = await db.get(
    'SELECT * FROM userSettings WHERE userID = ? AND platform = ?',
    [user.id, user.platform],
  );
  try {
    settings.groups = JSON.parse(settings.groups);
    res.json({
      settings: settings,
    });
  }
  catch (e) {
    console.log(e);
    res.status(400).json({
      error: 'E_UNKNOWN_ERROR',
      message: 'Unexpected error occured',
    });
  }
};
