const cli = require('cli');
const db = require('../lib/dbpromise');
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unpause')
    .setDescription('Unpause all notifications (you can specify label)')
    .addStringOption(option => option.setName('label').setDescription('Subscription label').setRequired(false)),
  async execute(interaction) {
    let output = '```Unpaused ';
    const label = interaction.options.getString('label');
    const user = interaction.user.id;

    const subs = await db.all('SELECT * from subscriptions where userID = ?', user);

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

    if (label === null) {
      await db.all('UPDATE subscriptions SET pausedUntil = ? WHERE userID = ?',
        [0, user]);
      output += 'all ';
      cli.ok(`${interaction.user.username} unpaused all notifications | ID: ${interaction.user.id}`);
    }
    else {
      await db.all('UPDATE subscriptions SET pausedUntil = ? WHERE userID = ? AND label = ?',
        [0, user, label]);
      output += `[${label}] `;
      cli.ok(`${interaction.user.username} unpaused [${label}] notifications | ID: ${interaction.user.id}`);
    }

    output += 'notifications!';
    output += '```';
    return interaction.reply({
      content: output,
      ephemeral: false,
    });
  },
};
