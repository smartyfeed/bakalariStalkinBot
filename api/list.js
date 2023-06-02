const db = require('../lib/dbpromise');
const generic = require('../bakalariStalkin/util/generic.js');

module.exports = async function(req, res) {
  const { user } = req.session;
  const activeSubs = await db.all('SELECT * FROM subscriptions WHERE userID = ? AND platform = ?', [user.id, user.platform]);
  for (const sub of activeSubs) {
    sub.className = (await generic.getClassInfo(sub.classID, false, sub.bakaServer)).name;
  }

  activeSubs.sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0));
  res.json(activeSubs);
};
