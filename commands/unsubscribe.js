const cli = require('cli');
const db = require("../lib/dbpromise");
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

    var save = await db.all("SELECT * FROM subscriptions WHERE userID = ? AND label = ? LIMIT 1", [owner, label]);
    if (save.length == 0) {
      return interaction.reply({ content: `Could not find an active subscription with this label`, ephemeral: true });
    }

    db.run("DELETE FROM subscriptions where userID = ? AND label = ?", [owner, label]);
    cli.ok(`${interaction.user.username} stopped stalking ${save[0].className} ${save[0].groups} | ID: ${interaction.user.id}`)
    return interaction.reply({ content: `Successfully unsubscribed! What a shame! :chicken:`, ephemeral: true });
  },
};
