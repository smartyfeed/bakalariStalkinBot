const cli = require('cli');
const cliui = require('cliui');
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
    var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));
    var activeSubs = save.subscriptions.filter(entry => entry.userID);
    var info = activeSubs.map(entry => `**${entry.label}** | ${entry.className} ${entry.groups}`)
                         .join('\n');
    return interaction.reply(info);
  },
};
