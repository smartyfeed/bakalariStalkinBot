const cli = require('cli');
const cliui = require('cliui');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  Client,
  Collection,
  Intents
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show user info')
    .addStringOption(option => option.setName('id').setDescription('User ID').setRequired(false))
    .addUserOption(option => option.setName('user').setDescription('Required user').setRequired(false)),
  async execute(interaction) {
    try {
      var ID = interaction.options.getString('id');
      var USER = interaction.options.getUser('user');

      var userID = ID || USER?.id || interaction.user.id;
      var user =  await module.exports.client.users.fetch(userID);

      if (!user.dmChannel) {
        try {
          await user.createDM();
        } catch (e) {
          cli.error(`Failed to create userDM channel with ${user.tag} | bot: ${user.bot}`);
        }
      }

      var output = '<@' + userID + '>\n```diff';
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
        ephemeral: true
      });
    } catch (e) {
      output = 'Something happened, we are not sure what. Try again, it might help. If the error persists please don\'t contact us. Our bot comes without any warranty';
      return interaction.reply({
        content: output,
        ephemeral: true
      });
    }
  },
};
