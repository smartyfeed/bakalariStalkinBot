const db = require('../lib/dbpromise');
const generic = require('../bakalariStalkin/util/generic.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Show active stalking sessions'),
  async execute(interaction) {
    const owner = interaction.user.id;
    let output = '';
    const activeSubs = await db.all('SELECT * FROM subscriptions WHERE userID = ?', owner);
    if (activeSubs.length === 0) {
      return interaction.reply({
        content: `No active sessions registered for ${interaction.user.username}`,
        ephemeral: true,
      });
    }
    for (const sub of activeSubs) {
      await updateClassIDs(sub.bakaServer);

      output += `**${sub.label}** | ${(await generic.getClassInfo(sub.classID, false, sub.bakaServer)).name} ${sub.groups ? sub.groups : ''}`;
      if (sub.pausedUntil && sub.pausedUntil >= new Date().getTime()) {
        const pauseEnd = new Date(sub.pausedUntil);
        const year = pauseEnd.getFullYear();
        const month = ('0' + (pauseEnd.getMonth() + 1)).slice(-2);
        const day = ('0' + pauseEnd.getDate()).slice(-2);
        const hours = ('0' + pauseEnd.getHours()).slice(-2);
        const minutes = ('0' + pauseEnd.getMinutes()).slice(-2);
        const seconds = ('0' + pauseEnd.getSeconds()).slice(-2);
        output += `**  ->**  Paused until **${day}.${month}.${year} ${hours}:${minutes}:${seconds}**`;
      }
      output += '\n';
    }
    return interaction.reply({
      content: output,
      ephemeral: true,
    });
  },
};
