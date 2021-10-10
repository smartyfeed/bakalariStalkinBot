const cli = require('cli');
const cliui = require('cliui');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

const index = require('../index.js');

module.exports = {
  hidden: true,
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show ALL stalking sessions'),
  async execute(interaction) {
    var stalkers = {};
    var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));

    for (var bruh of save.subscriptions) {
      if (!stalkers[bruh.userID]) {
        stalkers[bruh.userID] = [];
      }
      stalkers[bruh.userID].push(bruh);
    }
    var output = '```diff'
    for (var stalkerID in stalkers) {
      var subs = stalkers[stalkerID];
      var user = await index.client.users.fetch(stalkerID);
      output += `\n- ${user.username}#${user.discriminator}\n`
      for (var i = 0; i < subs.length; i++) {
        output += `+ ${subs[i].className} ${subs[i].groups} ${subs[i].label?` - ${subs[i].label}`:''}\n`
      }
    }
    output += '```';
    return interaction.reply({
      content: output,
      ephemeral: true
    });
  },
};
