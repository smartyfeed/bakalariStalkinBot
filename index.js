require('./bakalariStalkin/util/updateClassIDs.js');
const fs = require('fs');
const chalk = require('chalk');
const stalk = require('./stalk.js');
const apiServer = require('./apiServer.js');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const fetch = require('node-fetch');
const matrixSDK = require("matrix-bot-sdk");
const {
  Client, Collection, Intents,
} = require('discord.js');
const {
  token, apiPort, clientSecret, tgToken, mxHomeserver, mxToken
} = require('./config.json');
const {
  joinVoiceChannel
} = require('@discordjs/voice');

const { Telegraf, Markup } = require('telegraf');
const { add } = require('cheerio/lib/api/traversing.js');
const tg = new Telegraf(tgToken);

const matrixStorage = new matrixSDK.SimpleFsStorageProvider("matrix_storage.json");
const matrixCryptoProvider = new matrixSDK.RustSdkCryptoStorageProvider("./matrix_crypto_");
const matrixBot = new matrixSDK.MatrixClient(mxHomeserver, mxToken, matrixStorage, matrixCryptoProvider);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./save.db');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
stalk.client = client;
module.exports.client = client;
module.exports.db = db;
module.exports.tg = tg;
module.exports.matrixBot = matrixBot;

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

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  command.client = client;
  client.commands.set(command.data.name, command);
}

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

  tg.launch();
  await initMatrix();
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

async function initMatrix() {
  matrixSDK.AutojoinRoomsMixin.setupOnClient(matrixBot);
  try {
    await matrixBot.start();
    console.log('Matrix connected');
  } catch(e) {
    console.error(e);
  }
}

matrixBot.on("room.message", async (roomId, event) => {
  if (!event.content?.msgtype) return;
  if(event.sender === await matrixBot.getUserId()) return;
  event.__Room_ID = roomId;
  handleMSG(event);
});

matrixBot.on("room.join", (roomId, event) => {
  const message = "Hello! I'm luk mom I have a stalker. You can use me to get notifications about your classes. Send me !web to login to WebUI.";
  matrixBot.sendMessage(roomId, {
    "msgtype": "m.text",
    "body": message,
  });
});

matrixBot.on("room.event", async (roomId, event) => {
  if (event.type != "m.room.member" && event.content.membership != "leave") return;
  try{
    let members = await matrixBot.getJoinedRoomMembers(roomId);
    if (members.length == 1) {
      console.log("Leaving room " + roomId);
      await matrixBot.leaveRoom(roomId);
      console.log("Forgetting room " + roomId);
      await matrixBot.forgetRoom(roomId);
      console.log("Purging subs for room " + roomId);
      await db.run("DELETE FROM subscriptions WHERE userID = ?", [roomId]);
      console.log("Purging user settings for room " + roomId);
      await db.run("DELETE FROM userSettings WHERE userID = ?", [roomId]);
    }
  } catch(e) {
    console.error(e);
  }
  });

async function handleMSG(event) {
  const body = event["content"]["body"];
  if (!body) return;
  if (body.startsWith("!web")){
    let profile = await matrixBot.getUserProfile(event.sender);
    let avatar = await getMatrixAvatar(await matrixBot.getUserProfile(event.sender));
    let user = {
      id: event.__Room_ID,
      platform: 2,
      username: profile.displayname,
      avatar: avatar
    }

    let token = apiServer.createSession(user, true);

    const replyBody = "Here y'go: " + apiServer.redirectURI + "?t=" + token + " (expires in 1 hour)";
    const reply = matrixSDK.RichReply.createFor(event.__Room_ID, event, replyBody, replyBody);
    reply["msgtype"] = "m.notice";
    matrixBot.sendMessage(event.__Room_ID, reply);
  }
}

async function getMatrixAvatar(profile) {
  let mxAvatar = profile.avatar_url;
  const regex = /^mxc:\/\/(.*)\/(.*)/;
  let matches = mxAvatar.match(regex);

  const serverName = matches[1];
  const mediaId = matches[2];

  try {
    let img = await fetch(`https://matrix.smartyfeed.me/_matrix/media/r0/download/${serverName}/${mediaId}`);
    let buffer = await img.buffer();
    return("data:image/png;base64," +  buffer.toString('base64'));
  } catch(e) {
    console.error(e);
    return "";
  }
}

process.on("SIGINT", function() {
  client.user.setStatus('invisible');
  db.close(() => process.exit());
});

process.on("SIGTERM", function() {
  client.user.setStatus('invisible');
  db.close(() => process.exit());
});
