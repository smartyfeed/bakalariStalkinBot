const cli = require('cli');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause all notifications for a specific time (you can specify label)')
    .addStringOption(option => option.setName('duration').setDescription('Duration of pause (for example 13m, 3h, 7d)').setRequired(true))
    .addStringOption(option => option.setName('label').setDescription('Subscription label').setRequired(false)),
  async execute(interaction) {
    var duration = interaction.options.getString('duration');
    var offset;
    var interval;
    var output = '```Paused ';
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

    if (!/^[0-9]+[mhdMHD]$/.test(duration)) {
      cli.error(`Incorrect duration (${duration}) entered by ${interaction.user.username} | ${interaction.user.id}`)
      return interaction.reply({
        content: `Incorrect duration: ${duration}`,
        ephemeral: true
      });
    } else {
      duration = duration.split(/([0-9]+)(\D)/);
      duration.shift();
      duration.pop();

      switch (duration[1]) {
        case "m":
        case "M":
          offset = duration[0] * 60;
          interval = "minute";
          break;
        case "h":
        case "H":
          offset = duration[0] * 3600;
          interval = "hour";
          break;
        case "d":
        case "D":
          offset = duration[0] * 86400;
          interval = "day";
      }
    }

    if (label === null) {
      for (var sub of subs.subscriptions) {
        if (sub.userID == user) {
          sub.pausedUntil = Math.floor((new Date()).getTime() / 1000) + offset;
        }
      }
      output += 'all ';
      cli.ok(`${interaction.user.username} paused all notifications for ${duration[0]} ${interval}(s) | ID: ${interaction.user.id}`);
    } else {
      for (var sub of subs.subscriptions) {
        if (sub.userID == user && sub.label == label) {
          sub.pausedUntil = Math.floor((new Date()).getTime() / 1000) + offset;
        }
      }
      output += `[${label}] `;
      cli.ok(`${interaction.user.username} paused [${label}] notifications for ${duration[0]} ${interval}(s) | ID: ${interaction.user.id}`)
    }

    fs.writeFileSync("./subscriptions.json", JSON.stringify(subs, null, 2));
    output += `notifications for ${duration[0]} ${interval}(s)!`;
    output += '```';
    return interaction.reply({
      content: output,
      ephemeral: false
    });
  },
};
