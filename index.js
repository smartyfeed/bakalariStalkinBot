require('./bakalariStalkin/util/updateClassIDs.js');
const fs = require('fs');
const chalk = require('chalk');
const stalk = require('./stalk.js');
const apiServer = require('./apiServer.js');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const fetch = require('node-fetch');
const {markdownv2: format} = require('telegram-format');
const {
  Client, Collection, Intents,
} = require('discord.js');
const {
  token, apiPort, clientSecret, tgToken
} = require('./config.json');
const {
  joinVoiceChannel
} = require('@discordjs/voice');

const { Telegraf, Markup } = require('telegraf');
const tg = new Telegraf(tgToken);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./save.db');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
stalk.client = client;
module.exports.client = client;
module.exports.db = db;
module.exports.tg = tg;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  command.client = client;
  client.commands.set(command.data.name, command);
}

tg.command('start', (ctx) => ctx.reply(
  `Hello ${ctx.from.first_name}! I'm luk mom I have a stalker. You can use me to get notifications about your classes. Use /web to get a link for WebUI.`,
  Markup.keyboard([
    ["/web"],
  ])
));
tg.command('web', async (ctx) => {
  let photos = await ctx.telegram.getUserProfilePhotos(ctx.message.from.id, 0, 1);
  let photoURL = await ctx.telegram.getFileLink(photos.photos[0][0].file_id);

  let img = await fetch(photoURL.href);
  let buffer = await img.buffer();
  let avatar = "data:image/png;base64," +  buffer.toString('base64');
  let user = {
    id: ctx.message.from.id,
    platform: 1,
    username: `${ctx.message.from.first_name} ${ctx.message.from.last_name}`,
    avatar: avatar
  }

  let token = apiServer.createSession(user, true);
  await ctx.reply({text: `Here y'go: <a href="${apiServer.redirectURI}?t=${token}">${apiServer.redirectURI}?t=${token}</a> (expires in 1 hour)`, parse_mode: 'HTML' });

});

tg.launch();

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
