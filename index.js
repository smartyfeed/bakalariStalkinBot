require('./bakalariStalkin/util/updateClassIDs.js');

const stalk = require('./stalk.js');
const fs = require('fs');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const {
  Client,
  Collection,
  Intents
} = require('discord.js');
const {
  token
} = require('./config.json');
const {
  joinVoiceChannel
} = require('@discordjs/voice');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS]
});
stalk.client = client;
module.exports.client = client;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  command.client = client;
  client.commands.set(command.data.name, command);
}

if (!fs.existsSync('./subscriptions.json')) {
  fs.writeFileSync('./subscriptions.json', JSON.stringify({
    subscriptions: [],
  }));
}

client.once('ready', async () => {
  console.log('Ready!');
  const presenceUpdater = () => {
    client.user.setPresence({
      activities: [{
        name: 'everyone',
        type: 'WATCHING',
      }],
      status: 'online',
    });
  };
  setInterval(presenceUpdater, 60 * 60 * 1000);
  presenceUpdater();
  stalk.closestNotification();
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



client.login(token);
