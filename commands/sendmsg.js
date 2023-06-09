const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  hidden: true,
  data: new SlashCommandBuilder()
    .setName("sendmsg")
    .setDescription("Sends a message"),
  async execute(interaction) {
    return interaction.reply({
      content: `Bot commands are deprecated. Please use WebUI instead.\nhttps://bakalari.smartyfeed.me`,
      ephemeral: true,
    });
  },
};
