const cli = require('cli');
const cliui = require('cliui');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');
const db = require("../lib/dbpromise");
const generic = require('../bakalariStalkin/util/generic.js');
const {
  MessageAttachment
} = require('discord.js')

module.exports = {
  hidden: true,
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show ALL stalking sessions'),
  async execute(interaction) {
    await module.exports.client.application.fetch();
    if (!module.exports.client.application.owner.members?.find(member => member.user.id == interaction.user.id) &&
      module.exports.client.application.owner?.id != interaction.user.id)
      return interaction.reply({
        content: "You can not use this command",
        ephemeral: true
      });

    var stalkers = {};
    let subs = await db.all("SELECT * FROM subscriptions");

    for (let sub of subs) {
      sub.className = (await generic.getClassInfo(sub.classID, false, sub.bakaServer)).name;
    }

    for (let sub of subs) {
      if (!stalkers[sub.userID]) {
        stalkers[sub.userID] = [];

      }
      stalkers[sub.userID].push(sub);
    }

    await interaction.deferReply({
      ephemeral: true
    });

    let output = '';

    for (var stalkerID in stalkers) {
      let subs = stalkers[stalkerID];
      let user = await module.exports.client.users.fetch(stalkerID);
      output += `\n- ${user.tag}\n`;
      for (var i = 0; i < subs.length; i++) {
        output += `+ ID: ${subs[i].id} | ${subs[i].className} ${subs[i].groups?subs[i].groups:''} ${subs[i].label?` - ${subs[i].label}`:''}`
        if (subs[i].pausedUntil && subs[i].pausedUntil >= new Date().getTime()) {
          var pauseEnd = new Date(subs[i].pausedUntil);
          var year = pauseEnd.getFullYear();
          var month = ("0" + (pauseEnd.getMonth() + 1)).slice(-2);
          var day = ("0" + pauseEnd.getDate()).slice(-2);
          var hours = ("0" + pauseEnd.getHours()).slice(-2);
          var minutes = ("0" + pauseEnd.getMinutes()).slice(-2);
          var seconds = ("0" + pauseEnd.getSeconds()).slice(-2);
          output += `  ->  Paused until ${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
        }
        let notifTime = !!subs[i].notificationOnClassStart ? 'Class start' : 'Class end';
        output += `\n+ ${notifTime}`;
        output += `\n+ ${subs[i].bakaServer}\n\n`;
      }
    }

    const buffer = Buffer.from(output);
    const attachment = new MessageAttachment(buffer, 'file.diff')
    return interaction.editReply({
      ephemeral: true,
      files: [attachment]
    });
  },
}