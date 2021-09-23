const cli = require('cli');
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
      var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));

      save.subscriptions = save.subscriptions.filter(entry => entry.userID != owner);
      fs.writeFileSync("./subscriptions.json", JSON.stringify(save, null, 2));
      cli.ok(`${interaction.user.username} stopped stalking all people | ${owner}`)
      return interaction.reply({
        content: `Successfully unsubscribed from all!`,
        ephemeral: true
      });
    }
}
