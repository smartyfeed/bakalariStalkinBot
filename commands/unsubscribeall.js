const cli = require('cli');
const db = require("../lib/dbpromise");
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('unsubscribeall')
      .setDescription('Stop stalking people ffs'),

    async execute(interaction) {
      const owner = interaction.user.id;
      
      db.run("DELETE FROM subscriptions where userID = ?", owner);
      cli.ok(`${interaction.user.username} stopped stalking all people | ${owner}`)
      return interaction.reply({
        content: `Successfully unsubscribed from all!`,
        ephemeral: true
      });
    }
}
