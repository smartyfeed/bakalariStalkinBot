const generic = require("../bakalariStalkin/util/generic.js");
const getBaseUrl = require("../bakalariStalkin/util/getBaseUrl.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription("Initiate a stalking session for a specific class/group."),
  async execute(interaction) {
    return interaction.reply({
      content: `Bot commands are deprecated. Please use WebUI instead.\nhttps://bakalari.smartyfeed.me`,
      ephemeral: true,
    });
  },
};
