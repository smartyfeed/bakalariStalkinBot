require('./bakalariStalkin/util/updateClassIDs.js');
const fs = require('fs');
const chalk = require('chalk');
const stalk = require('./stalk.js');
const apiServer = require('./apiServer.js');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const redis = require('redis');
const {
  Client, Collection, Intents,
} = require('discord.js');
const {
  token, apiPort, clientSecret, redisAddress, redisPort
} = require('./config.json');
const {
  joinVoiceChannel
} = require('@discordjs/voice');

const cache = redis.createClient({
  socket: {
      host: redisAddress,
      port: redisPort
  },
  database: 1,
  name: 'bakalariStalkinBot'
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./save.db');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
stalk.client = client;
module.exports.client = client;
module.exports.db = db;

stalk.cache = cache;
module.exports.cache = cache;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  command.client = client;
  client.commands.set(command.data.name, command);
}

cache.on('error', err => console.log('Redis Server Error', err));
cache.once('ready', () => {
  console.log('Connected to Redis at ' + redisAddress + ':' + redisPort + '!');
});

client.once('ready', async () => {
  console.log('Ready as "' + client?.user?.username + "#" + client?.user?.discriminator + '"');
  const presenceUpdater = () => {
    client.user.setPresence({
      activities: [{
        name: process.env.NODE_ENV == 'development' ? 'my code' : 'everyone',
        type: 'WATCHING',
      }],
      status: 'online',
    });
  };
  setInterval(presenceUpdater, 60 * 60 * 1000);
  presenceUpdater();
  await cache.connect();
  stalk.stalk();
  apiServer.start({ port: apiPort, clientSecret });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

client.on('debug', debug => {
  if([
    "[HeartbeatTimer] Sending a heartbeat.",
    "Heartbeat acknowledged, latency of ",
  ].some(x => debug.includes(x)))
    return; // ignore common logs
  console.log(chalk.gray('[djsd] ' + debug));
});

db.serialize(function() {
  require("./lib/initdb")(db);

  client.login(token);
});

process.on("SIGINT", function() {
  client.user.setStatus('invisible');
  db.close(() => process.exit());
});

process.on("SIGTERM", function() {
  client.user.setStatus('invisible');
  db.close(() => process.exit());
});
