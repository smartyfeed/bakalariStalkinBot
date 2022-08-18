const fetch = require('node-fetch');

module.exports = async function(req, res) {
  var { user } = req.session;
  res.json(user);
}
