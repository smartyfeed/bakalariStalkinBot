const cli = require('cli');
const cliui = require('cliui');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unsubscribe')
    .setDescription('Terminate a stalking session')
    .addStringOption(option => option.setName('label').setDescription('Your label').setRequired(true)),
  async execute(interaction) {
    const label = interaction.options.getString('label');
    const owner = interaction.user.id;

    var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));
    var index = save.subscriptions.findIndex(entry => entry.userID === owner && entry.label === label);
    if (index == -1) {
      return interaction.reply(`Could not find an active subscription with this label`);
    }

    var [info] = save.subscriptions.splice(index, 1);
    fs.writeFileSync("./subscriptions.json", JSON.stringify(save, null, 2));
    cli.ok(`${interaction.user.username} stopped stalking ${info.className} ${info.groups} | ID: ${interaction.user.id}`)
    return interaction.reply(`Successfully unsubscribed! What a shame! :chicken:`);
  },
};
