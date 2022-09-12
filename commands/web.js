const { SlashCommandBuilder } = require('@discordjs/builders');
const api = require("../apiServer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('web')
    .setDescription('Log in to the web interface'),
  async execute(interaction) {
    const owner = interaction.user;
    await owner.fetch();
    const token = api.createSession(owner, true);

    return interaction.reply({
      content: `Here y'go: ${api.redirectURI}?t=${token}`,
      ephemeral: true,
    });
  },
};
