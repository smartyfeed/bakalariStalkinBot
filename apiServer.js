const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const fetch = require('node-fetch');
const cli = require('cli');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { tgToken } = require('./config.json');

module.exports.redirectURI = 'https://bakalari.smartyfeed.me/api/auth';

const sessions = new Map();
module.exports.sessions = sessions;
let client;

module.exports.start = async function({ port, discordSecret }) {
  client = require('./index').client;
  const app = express();

  await client.application.fetch();

  if (process.env.NODE_ENV == 'development') {
    app.use(require('cors')());
    module.exports.redirectURI = `http://localhost:${port}/auth`;
  }

  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/', function(req, res) {
    res.send('API not documented, to chcete moc');
  });

  app.get('/auth', async function(req, res) {
    if (req.query?.t) { // Link-login attempt
      if (sessions.has(req.query.t)) {
        const session = sessions.get(req.query.t);
        if (session.authBefore > Date.now()) {
          cli.info('Link-login');
          const newToken = module.exports.createSession(session.user, false);
          sessions.delete(req.query.t);
          return res.cookie('token', newToken).redirect(process.env.NODE_ENV == 'development' ? 'http://localhost:3000/#' + newToken : '/');
        }
      }
      else {
        return res.redirect(process.env.NODE_ENV == 'development' ? 'http://localhost:3000/#' : '/');
      }
    }

    if (!req.query?.code) { // Discord OAuth attempt
      const token = req.query?.token || req.cookies?.token;
      if (token && sessions.has(token)) {
        return res.redirect(process.env.NODE_ENV == 'development' ? 'http://localhost:3000/#' + token : '/');
      }
      return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${client.application.id}&redirect_uri=${encodeURIComponent(module.exports.redirectURI)}&response_type=code&scope=identify`);
    }

    try {
      const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: client.application.id,
          client_secret: discordSecret,
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
      if (oauthData.error) throw oauthData;

      const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });

      const discordUser = await userResult.json();

      const user = {
        id: discordUser.id,
        username: discordUser.username,
        avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`,
        platform: 0,
      };

      const stalkerToken = module.exports.createSession(user, false);
      res.cookie('token', stalkerToken).redirect(process.env.NODE_ENV == 'development' ? 'http://localhost:3000/#' + stalkerToken : '/');
    }
    catch (error) {
      console.error(error);
      res.status(401).json({
        error: 'E_BAD_CODE',
        message: 'Provided Discord code is not valid or an unknown error occurred while creating the session',
      });
    }
  });

  app.get('/telegramAuth', async function(req, res) {
    const query = req.query;

    const data_check_arr = [];

    for (const key in query) {
      if (key == 'hash') continue;
      data_check_arr.push(key + '=' + query[key]);
    }

    data_check_arr.sort();

    const data_check_string = data_check_arr.join('\n');

    const secret_key = crypto.createHash('sha256').update(tgToken).digest();
    const hmac = crypto.createHmac('sha256', secret_key).update(data_check_string).digest('hex');

    if (hmac != query.hash || (Date.now() - query.auth_date * 1000) > 86400000) {
      return res.redirect(process.env.NODE_ENV == 'development' ? 'http://localhost:3000/#' : '/');
    }

    const user = {
      id: query.id,
      username: query.first_name + ' ' + query.last_name,
      avatar: query.photo_url,
      platform: 1,
    };
    const stalkerToken = module.exports.createSession(user, false);
    res.cookie('token', stalkerToken).redirect(process.env.NODE_ENV == 'development' ? 'http://localhost:3000/#' + stalkerToken : '/');
  });

  app.get('/logout', async function(req, res) {
    const token = req.query?.token || req.cookies?.token;
    if (token && sessions.has(token)) {
      sessions.delete(token);
    }
    res.redirect(process.env.NODE_ENV == 'development' ? 'http://localhost:3000' : '/');
  });

  app.use(function(req, res, next) {
    const token = req.query?.token || req.cookies?.token;
    if (token && sessions.has(token) && !sessions.get(token).isLink) {
      req.session = sessions.get(token);
      next();
    }
    else {
      res.status(401).json({
        error: 'E_BAD_SESSION_TOKEN',
        message: 'Session token invalid or missing',
      });
    }
  });

  app.get('/user', require('./api/user'));
  app.get('/list', require('./api/list'));
  app.get('/settings', require('./api/settings'));
  app.get('/admin', require('./api/admin'));

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
  const stalkerToken = uuid.v4();
  const session = {};
  sessions.set(stalkerToken, session);
  session.user = user;
  session.isLink = isLink;
  session.isAdmin = client.application.owner.members?.find(member => member.user.id == user.id) ? true : false;
  if (isLink) {session.authBefore = Date.now() + 5 * 60 * 1000;}
  cli.ok(`Made ${isLink ? 'auth link' : 'session'} for ${user.username}@${(({ 0: 'Discord', 1: 'Telegram', 2: 'Matrix'})[user.platform] ?? 'Unknown')}`);
  return stalkerToken;
};
