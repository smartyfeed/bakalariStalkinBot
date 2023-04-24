const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const fetch = require('node-fetch');
const cli = require('cli');
const cookieParser = require('cookie-parser');

module.exports.redirectURI = "https://bakalari.smartyfeed.me/api/auth";

var sessions = new Map();
module.exports.sessions = sessions;

module.exports.start = async function({ port, clientSecret }) {
  const { client } = require('./index');
  const app = express();

  await client.application.fetch();

  if(process.env.NODE_ENV == 'development') {
    app.use(require('cors')());
    module.exports.redirectURI = `http://localhost:${port}/auth`;
  }

  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/', function (req, res) {
    res.send('API not documented, to chcete moc');
  });

  app.get('/auth', async function (req, res) {
    if(req.query?.t && sessions.has(req.query.t)) {
      let session = sessions.get(req.query.t);
      if(session.authBefore > Date.now()) {
        cli.info("Link-login");
        var newToken = module.exports.createSession(session.user, false);
        sessions.delete(req.query.t);
        return res.cookie("token", newToken).redirect(process.env.NODE_ENV == 'development' ? "http://localhost:3000/#" + newToken : "/");
      }
    }
  
    if(!req.query?.code) {
      var token  = req.query?.token || req.cookies?.token;
      if(token && sessions.has(token)) {
        return res.redirect(process.env.NODE_ENV == 'development' ? "http://localhost:3000/#" + token : "/");
      }
      return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${client.application.id}&redirect_uri=${encodeURIComponent(module.exports.redirectURI)}&response_type=code&scope=identify`);
    }

    try {
      const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: client.application.id,
          client_secret: clientSecret,
          code: req.query.code,
          grant_type: 'authorization_code',
          redirect_uri: module.exports.redirectURI,
          scope: 'identify',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const oauthData = await oauthResult.json();
      if(oauthData.error) throw oauthData.error;

      const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });

      let stalkerToken = module.exports.createSession(await userResult.json(), false);
      res.cookie("token", stalkerToken).redirect(process.env.NODE_ENV == 'development' ? "http://localhost:3000/#" + stalkerToken : "/");
    } catch (error) {
      console.error(error)
      res.status(401).json({
        error: "E_BAD_CODE",
        message: "Provided Discord code is not valid or an unknown error occurred while creating the session",
      });
    }
  });

  app.get('/logout', async function (req, res) {
    var token  = req.query?.token || req.cookies?.token;
    if(token && sessions.has(token)) {
      sessions.delete(token);
    }
    res.redirect(process.env.NODE_ENV == 'development' ? "http://localhost:3000" : "/");
  });

  app.use(function (req, res, next) {
    var token  = req.query?.token || req.cookies?.token;
    if(token && sessions.has(token) && !sessions.get(token).isLink) {
      req.session = sessions.get(token);
      next();
    } else {
      res.status(401).json({
        error: "E_BAD_SESSION_TOKEN",
        message: "Session token invalid or missing",
      });
    }
  });

  app.get('/user', require('./api/user'));
  app.get('/list', require('./api/list'));
  app.get('/settings', require('./api/settings'));

  app.post('/updateSettings', require('./api/updateSettings'));
  app.post('/sub', require('./api/sub'));
  app.post('/manageSub', require('./api/manageSub'));
  app.post('/deleteSub', require('./api/deleteSub'));
  app.post('/pauseSub', require('./api/pauseSub'));

  app.listen(port);
  cli.ok(`API server listening on ${port}`);
  cli.info(`Auth at ${module.exports.redirectURI}`);
};

module.exports.createSession = function(user, isLink) {
  var stalkerToken = uuid.v4();
  var session = {};
  sessions.set(stalkerToken, session);
  session.user = user;
  session.isLink = isLink;
  if(isLink)
    session.authBefore = Date.now() + 5 * 60 * 1000;
  cli.ok(`Made ${isLink ? "auth link" : "session"} for ${user.username}#${user.discriminator}`);
  return stalkerToken;
};
