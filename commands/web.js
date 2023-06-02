const { SlashCommandBuilder } = require('@discordjs/builders');
const api = require('../apiServer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('web')
    .setDescription('Log in to the web interface'),
  async execute(interaction) {
    const owner = interaction.user;
    await owner.fetch();
    const user = {
      id: owner.id,
      username: owner.username,
      avatar: `https://cdn.discordapp.com/avatars/${owner.id}/${owner.avatar}.png?size=256`,
      platform: 0,
    };
    const token = api.createSession(user, true);

    return interaction.reply({
      content: `Here y'go: <${api.redirectURI}?t=${token}>`,
      ephemeral: true,
    });
  },
};
