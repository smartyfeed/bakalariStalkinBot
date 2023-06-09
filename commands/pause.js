const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription(
      "Pause all notifications for a specific time (you can specify label)"
    ),
  async execute(interaction) {
    return interaction.reply({
      content: `Bot commands are deprecated. Please use WebUI instead.\nhttps://bakalari.smartyfeed.me`,
      ephemeral: true,
    });
  },
};
