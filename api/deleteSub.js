const db = require('../lib/dbpromise');

module.exports = async function(req, res) {
  const { user } = req.session;

  const sub = await db.get(
    'SELECT * FROM subscriptions WHERE userID = ? AND id = ? AND platform = ?',
    [user.id, req.body.id, user.platform],
  );

  if (!sub) {
    return res.status(400).json({
      error: 'E_BAD_SUBSCRIPTION_ID',
      message: 'Provided subscription ID is not valid',
    });
  }

  await db.run('DELETE FROM subscriptions WHERE id = ?', [req.body.id]);

  return res.status(200).json({
    message: 'OK',
  });
};
