const fetch = require('node-fetch');

module.exports = async function(req, res) {
  var { authData } = req.session;
  const response = await fetch('https://discord.com/api/users/@me', {
  	headers: {
  		authorization: `${authData.token_type} ${authData.access_token}`,
  	},
  });
  const result = await response.json();

  res.json(result);
}
