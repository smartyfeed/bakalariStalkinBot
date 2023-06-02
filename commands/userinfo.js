const cli = require('cli');
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show user info')
    .addStringOption(option => option.setName('id').setDescription('User ID').setRequired(false))
    .addUserOption(option => option.setName('user').setDescription('Required user').setRequired(false)),
  async execute(interaction) {
    try {
      const ID = interaction.options.getString('id');
      const USER = interaction.options.getUser('user');

      const userID = ID || USER?.id || interaction.user.id;
      const user = await module.exports.client.users.fetch(userID);

      if (!user.dmChannel) {
        try {
          await user.createDM();
        }
        catch (e) {
          cli.error(`Failed to create userDM channel with ${user.tag} | bot: ${user.bot}`);
        }
      }

      let output = '<@' + userID + '>\n```diff';
      output += `
- ${user.tag}
+ User id: ${user.id}
+ Is bot: ${user.bot}
+ Created at: ${user.createdAt}
+ Timestamp: ${user.createdTimestamp}
+ DM Channel: ${user.dmChannel?.id}
+ Avatar URL: ${user.displayAvatarURL()}
`;

      output += '```';
      return interaction.reply({
        content: output,
        ephemeral: true,
      });
    }
    catch (e) {
      const output = 'Something happened, we are not sure what. Try again, it might help. If the error persists please don\'t contact us. Our bot comes without any warranty';
      return interaction.reply({
        content: output,
        ephemeral: true,
      });
    }
  },
};
