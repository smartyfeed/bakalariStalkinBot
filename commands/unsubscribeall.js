const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unsubscribeall")
    .setDescription("Stop stalking people ffs"),

  async execute(interaction) {
    return interaction.reply({
      content: `Bot commands are deprecated. Please use WebUI instead.\nhttps://bakalari.smartyfeed.me`,
      ephemeral: true,
    });
  },
};
