const fetch = require('node-fetch');

module.exports = async function(req, res) {
  var { user, isAdmin } = req.session;
  res.json({...user, isAdmin: isAdmin});
}
