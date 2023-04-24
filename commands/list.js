const db = require("../lib/dbpromise");
const cli = require('cli');
const cliui = require('cliui');
const generic = require('../bakalariStalkin/util/generic.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Show active stalking sessions'),
  async execute(interaction) {
    const owner = interaction.user.id;
    var output = '';
    var activeSubs = await db.all("SELECT * FROM subscriptions WHERE userID = ?", owner);
    if (activeSubs.length === 0) return interaction.reply({
      content: `No active sessions registered for ${interaction.user.username}`,
      ephemeral: true
    });
    for (sub of activeSubs) {
      await updateClassIDs(sub.bakaServer);
      
      output += `**${sub.label}** | ${await generic.getClassInfo(sub.classID, false, sub.bakaServer).name} ${sub.groups?sub.groups:''}`;
      if (sub.pausedUntil && sub.pausedUntil >= new Date().getTime()) {
        var pauseEnd = new Date(sub.pausedUntil);
        var year = pauseEnd.getFullYear();
        var month = ("0" + (pauseEnd.getMonth() + 1)).slice(-2);
        var day = ("0" + pauseEnd.getDate()).slice(-2);
        var hours = ("0" + pauseEnd.getHours()).slice(-2);
        var minutes = ("0" + pauseEnd.getMinutes()).slice(-2);
        var seconds = ("0" + pauseEnd.getSeconds()).slice(-2);
        output += `**  ->**  Paused until **${day}.${month}.${year} ${hours}:${minutes}:${seconds}**`;
      }
      output += '\n';
    }
    return interaction.reply({
      content: output,
      ephemeral: true
    });
  },
};
