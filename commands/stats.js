const cli = require('cli');
const cliui = require('cliui');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  hidden: true,
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show ALL stalking sessions'),
  async execute(interaction) {
    await module.exports.client.application.fetch();
    if (!module.exports.client.application.owner.members?.find(member => member.user.id == interaction.user.id)
      && module.exports.client.application.owner?.id != interaction.user.id)
      return interaction.reply({
        content: "You can not use this command",
        ephemeral: true
      });

    var stalkers = {};
    var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));

    for (var bruh of save.subscriptions) {
      if (!stalkers[bruh.userID]) {
        stalkers[bruh.userID] = [];
      }
      stalkers[bruh.userID].push(bruh);
    }
    var output = '```diff'
    for (var stalkerID in stalkers) {
      var subs = stalkers[stalkerID];
      var user = await module.exports.client.users.fetch(stalkerID);
      output += `\n- ${user.tag}\n`
      for (var i = 0; i < subs.length; i++) {
        output += `+ ${subs[i].className} ${subs[i].groups?subs[i].groups:''} ${subs[i].label?` - ${subs[i].label}`:''}`
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
        output += '\n';
      }
    }
    output += '```';
    return interaction.reply({
      content: output,
      ephemeral: true
    });
  },
};
