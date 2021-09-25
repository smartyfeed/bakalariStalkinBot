const {
  SlashCommandBuilder
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prunedm')
    .setDescription('Prune up to 99 messages in dms.')
    .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to prune')),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (amount <= 1 || amount > 100) {
      return interaction.reply({
        content: 'You need to input a number between 1 and 99.',
        ephemeral: true
      });
    }
    await interaction.user.send('This will be deleted in the future');

    var messages = await interaction.user.dmChannel.messages.fetch({
      limit: amount
    });

    messages.forEach((message) => {
      try {
        message.delete()
      } catch (e) {}

    });

    return interaction.reply({
      content: `Successfully pruned \`${amount}\` messages.`,
      ephemeral: true
    });
  },
};
