const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prune")
    .setDescription("Prune up to 99 messages.")
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Number of messages to prune")
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");

    if (amount <= 1 || amount > 100) {
      return interaction.reply({
        content: "You need to input a number between 1 and 99.",
        ephemeral: true,
      });
    }

    console.log(interaction.inGuild());
    if (interaction.inGuild()) {
      await interaction.channel.bulkDelete(amount, true).catch((error) => {
        console.error(error);
        interaction.reply({
          content:
            "There was an error trying to prune messages in this channel!",
          ephemeral: true,
        });
      });
    } else {
      if (!interaction.user.dmChannel) {
        await interaction.user.createDM();
      }
      const messages = await interaction.user.dmChannel.messages.fetch({
        limit: amount + 1,
      });

      messages.forEach(async (message) => {
        try {
          await message.delete();
        } catch (e) {
          console.error(e);
        }
      });
    }

    return interaction.reply({
      content: `Successfully pruned \`${amount}\` messages.`,
      ephemeral: true,
    });
  },
};
