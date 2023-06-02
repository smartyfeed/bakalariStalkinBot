const {
  SlashCommandBuilder,
} = require('@discordjs/builders');
const db = require('../lib/dbpromise');
const generic = require('../bakalariStalkin/util/generic.js');
const {
  MessageAttachment,
} = require('discord.js');

module.exports = {
  hidden: true,
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show ALL stalking sessions'),
  async execute(interaction) {
    await module.exports.client.application.fetch();
    if (!module.exports.client.application.owner.members?.find(member => member.user.id == interaction.user.id) &&
      module.exports.client.application.owner?.id != interaction.user.id) {
      return interaction.reply({
        content: 'You can not use this command',
        ephemeral: true,
      });
    }

    const stalkers = {};
    const subs = await db.all('SELECT * FROM subscriptions');

    for (const sub of subs) {
      sub.className = (await generic.getClassInfo(sub.classID, false, sub.bakaServer)).name;
    }

    for (const sub of subs) {
      if (!stalkers[sub.userID]) {
        stalkers[sub.userID] = [];

      }
      stalkers[sub.userID].push(sub);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    let output = '';

    for (const stalkerID in stalkers) {
      const stalkerSubs = stalkers[stalkerID];
      const user = await module.exports.client.users.fetch(stalkerID);
      output += `\n- ${user.tag}\n`;
      for (let i = 0; i < stalkerSubs.length; i++) {
        output += `+ ID: ${stalkerSubs[i].id} | ${stalkerSubs[i].className} ${stalkerSubs[i].groups ? stalkerSubs[i].groups : ''} ${stalkerSubs[i].label ? ` - ${stalkerSubs[i].label}` : ''}`;
        if (stalkerSubs[i].pausedUntil && stalkerSubs[i].pausedUntil >= new Date().getTime()) {
          const pauseEnd = new Date(stalkerSubs[i].pausedUntil);
          const year = pauseEnd.getFullYear();
          const month = ('0' + (pauseEnd.getMonth() + 1)).slice(-2);
          const day = ('0' + pauseEnd.getDate()).slice(-2);
          const hours = ('0' + pauseEnd.getHours()).slice(-2);
          const minutes = ('0' + pauseEnd.getMinutes()).slice(-2);
          const seconds = ('0' + pauseEnd.getSeconds()).slice(-2);
          output += `  ->  Paused until ${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
        }
        const notifTime = stalkerSubs[i].notificationOnClassStart ? 'Class start' : 'Class end';
        output += `\n+ ${notifTime}`;
        output += `\n+ ${stalkerSubs[i].bakaServer}\n\n`;
      }
    }

    const buffer = Buffer.from(output);
    const attachment = new MessageAttachment(buffer, 'file.diff');
    return interaction.editReply({
      ephemeral: true,
      files: [attachment],
    });
  },
};
