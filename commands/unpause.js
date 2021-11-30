const cli = require('cli');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unpause')
    .setDescription('Unpause all notifications (you can specify label)')
    .addStringOption(option => option.setName('label').setDescription('Subscription label').setRequired(false)),
  async execute(interaction) {
    var output = '```Unpaused ';
    const label = interaction.options.getString('label');
    const user = interaction.user.id;

    var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));
    var subs = save;

    if (interaction.inGuild()) {
      return interaction.reply({
        content: `Please use the command in DM channel with the bot`,
        ephemeral: true
      });
    }

    if (save.subscriptions.findIndex(entry => entry.userID === user) == -1) {
      return interaction.reply({
        content: `You don't have any active subscriptions`,
        ephemeral: true
      });
    }

    if (label && save.subscriptions.findIndex(entry => entry.userID === user && entry.label === label) == -1) {
      var activeSubs = save.subscriptions.filter(entry => entry.userID === user);
      var info = '```Active subs:\n';
      info += activeSubs.map(entry => `${entry.label} | ${entry.className} ${entry.groups}`)
        .join('\n');
      info += '```';
      return interaction.reply({
        content: `Could not find an active subscription with label - ${label}${info}`,
        ephemeral: true
      });
    }

    if (label === null) {
      for (var sub of subs.subscriptions) {
        if (sub.userID == user) {
          sub.pausedUntil = 0;
        }
      }
      output += 'all ';
      cli.ok(`${interaction.user.username} unpaused all notifications | ID: ${interaction.user.id}`);
    } else {
      for (var sub of subs.subscriptions) {
        if (sub.userID == user && sub.label == label) {
          sub.pausedUntil = 0;
        }
      }
      output += `[${label}] `;
      cli.ok(`${interaction.user.username} unpaused [${label}] notifications | ID: ${interaction.user.id}`)
    }

    fs.writeFileSync("./subscriptions.json", JSON.stringify(subs, null, 2));
    output += `notifications!`;
    output += '```';
    return interaction.reply({
      content: output,
      ephemeral: false
    });
  },
};
