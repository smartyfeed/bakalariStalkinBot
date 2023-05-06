const db = require("../lib/dbpromise");
const generic = require("../bakalariStalkin/util/generic.js");
const ms = require('ms');
const fs = require('fs');
const stalk = require("../stalk.js");

module.exports = async function (req, res) {
  var { user, isAdmin } = req.session;
  const { client } = require("../index");

  let classIds = JSON.parse(fs.readFileSync("bakalariStalkin/classIds.json", "utf8"));

  if (!isAdmin) {
    return res.status(403).json({
      status: 403,
      error: "E_UNAUTHORIZED",
      message: "You are not authorized to access this",
    });
  }

  var stalkers = {};
  let subs = await db.all("SELECT * FROM subscriptions");

  for (let sub of subs) {
    sub.className = (
      await generic.getClassInfo(sub.classID, false, sub.bakaServer)
    ).name;
  }

  for (let sub of subs) {
    if (!stalkers[sub.userID]) {
      stalkers[sub.userID] = {};
      stalkers[sub.userID].subs = [];
      stalkers[sub.userID].user = await client.users.fetch(sub.userID);
    }
    sub.groups = JSON.parse(sub.groups);
    stalkers[sub.userID].subs.push(sub);
  }

  var stats = {
    discord: {},
    env: {},
    stalk: {},
  };

  stats.discord.connection = {
    gateway: client.ws.gateway,
    ping: client.ws.ping,
  };
  stats.discord.uptime = client.uptime + ` (${ms(client.uptime)})`;
  stats.discord.cache = {
    users: client.users.cache.size,
    guilds: client.guilds.cache.size,
    channels: client.channels.cache.size,
    messages: client.channels.cache
      .map((channel) => channel.messages?.cache.size || 0)
      .reduce((a, c) => a + c, 0),
  };

  let hash = fs.readFileSync(".git/" + fs.readFileSync(".git/HEAD", "utf8").replace(/ref: |\n/g,""), "utf8");
  stats.env = {
    node: process.version,
    commit: hash.substr(0, 6),
    uptime: process.uptime(),
  };
  stats.env.uptime = `${stats.env.uptime} (${ms(stats.env.uptime * 1000)})`;

  stats.stalk = {
    subs: subs.length,
    TTs: Object.keys(stalk.timetables).length,
    schools: Object.keys(classIds).length,
  }

  res.json({ status: 200, stalkers: stalkers, stats: stats });
};
