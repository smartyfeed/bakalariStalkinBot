var sessions = new Map();
module.exports.sessions = sessions;

module.exports.start = async function({ port, clientSecret }) {
  const { client } = require('./index');
  const express = require('express');
  const uuid = require('uuid');
  const fetch = require('node-fetch');
  const cli = require('cli');
  const app = express();

  await client.application.fetch();

  app.get('/', function (req, res) {
    res.send('API not documented, to chcete moc');
  });

  app.get('/auth', async function (req, res) {
    if(!req.query.code)
      return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${client.application.id}&redirect_uri=http%3A%2F%2Flocalhost%3A1337%2Fauth&response_type=code&scope=identify`);

    try {
			const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams({
					client_id: client.application.id,
					client_secret: clientSecret,
					code: req.query.code,
					grant_type: 'authorization_code',
					redirect_uri: `http://localhost:1337/auth`,
					scope: 'identify',
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
      const oauthData = await oauthResult.json();
      if(oauthData.error) throw oauthData.error;

      var stalkerToken = uuid.v4();
      var session = {};
      sessions.set(stalkerToken, session);
      session.authData = oauthData;
			res.json({ token: stalkerToken });
		} catch (error) {
      console.error(error)
			res.status(401).send("Invalid Discord token");
		}
  });

  app.use(function (req, res, next) {
    var token  = req.query?.token;
    if(token && sessions.has(token)) {
      req.session = sessions.get(token);
      next();
    } else {
      res.status(401).send("401 Unauthorized");
    }
  });

  app.get('/user', require('./api/user'));

  app.listen(port);
  cli.ok(`API server listening on ${port}`);
}
