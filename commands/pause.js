const cli = require('cli');
const db = require('../lib/dbpromise');
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause all notifications for a specific time (you can specify label)')
    .addStringOption(option => option.setName('duration').setDescription('Duration of pause (for example 13m, 3h, 7d)').setRequired(true))
    .addStringOption(option => option.setName('label').setDescription('Subscription label').setRequired(false)),
  async execute(interaction) {
    let duration = interaction.options.getString('duration');
    let offset;
    let interval;
    let output = '```Paused ';
    const label = interaction.options.getString('label');
    const user = interaction.user.id;

    const subs = await db.all('SELECT * FROM subscriptions WHERE userID = ?', user);

    if (interaction.inGuild()) {
      return interaction.reply({
        content: 'Please use the command in DM channel with the bot',
        ephemeral: true,
      });
    }

    if (!subs.length) {
      return interaction.reply({
        content: 'You don\'t have any active subscriptions',
        ephemeral: true,
      });
    }

    const subsByLabel = await db.all('SELECT * FROM subscriptions WHERE userID = ? AND label = ?', [user, label]);
    if (label && !subsByLabel.length) {
      let info = '```Active subs:\n';
      info += subs.map(entry => `${entry.label} | ${entry.className} ${entry.groups}`)
        .join('\n');
      info += '```';
      return interaction.reply({
        content: `Could not find an active subscription with label - ${label}${info}`,
        ephemeral: true,
      });
    }

    if (!/^[0-9]+[mhdMHD]$/.test(duration)) {
      cli.error(`Incorrect duration (${duration}) entered by ${interaction.user.username} | ${interaction.user.id}`);
      return interaction.reply({
        content: `Incorrect duration: ${duration}`,
        ephemeral: true,
      });
    }
    else {
      duration = duration.split(/([0-9]+)(\D)/);
      duration.shift();
      duration.pop();

      switch (duration[1]) {
        case 'm':
        case 'M':
          offset = duration[0] * 60;
          interval = 'minute';
          break;
        case 'h':
        case 'H':
          offset = duration[0] * 3600;
          interval = 'hour';
          break;
        case 'd':
        case 'D':
          offset = duration[0] * 86400;
          interval = 'day';
      }
    }

    if (label === null) {
      await db.all('UPDATE subscriptions SET pausedUntil = ? WHERE userID = ?',
        [new Date().getTime() + (offset * 1000), user]);
      output += 'all ';
      cli.ok(`${interaction.user.username} paused all notifications for ${duration[0]} ${interval}(s) | ID: ${interaction.user.id}`);
    }
    else {
      await db.all('UPDATE subscriptions SET pausedUntil = ? WHERE userID = ? AND label = ?',
        [new Date().getTime() + (offset * 1000), user, label]);
      output += `[${label}] `;
      cli.ok(`${interaction.user.username} paused [${label}] notifications for ${duration[0]} ${interval}(s) | ID: ${interaction.user.id}`);
    }

    output += `notifications for ${duration[0]} ${interval}(s)!`;
    output += '```';
    return interaction.reply({
      content: output,
      ephemeral: false,
    });
  },
};
