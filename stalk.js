const fs = require('fs');
const cli = require('cli');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const utils = require('./bakalariStalkin/util/generic.js');
const {
  MessageEmbed
} = require('discord.js');

var times = JSON.parse(fs.readFileSync("./times.json", "UTF8"));
var nextLesson;

module.exports.stalk = stalk;
module.exports.closestNotification = closestNotification;

async function stalk() {
  var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));

  var classNames = new Set();
  var rozvrhy = {};

  for (var i = 0; i < save.subscriptions.length; i++) {
    classNames.add(utils.getClassInfo(save.subscriptions[i].className).id);
  }

  for (var item of classNames) {
    var timeTable = await getTT(item);
    rozvrhy[utils.getClassInfo(item).name] = timeTable;
  }

  for (var i = 0; i < save.subscriptions.length; i++) {
    var subInfo = save.subscriptions[i];
    if (subInfo.pausedUntil && subInfo.pausedUntil >= Date.now()) {
      continue;
    }
    var user = await module.exports.client.users.fetch(subInfo.userID);
    var day = rozvrhy[subInfo.className]
      .filter(atom => atom.dayOfWeekAbbrev == utils.dayOfWeekAbbrev(0))
      .filter(utils.filterGroups(subInfo.groups))
      .filter(atom => atom.period == nextLesson);


    for (var j = 0; j < day.length; j++) {
      var lesson = day[j];
      const lukMomIhaveEmbed = new MessageEmbed()
        .setColor(lesson.changeinfo !== ""?'#ff3300':'#0099ff')
        .setTitle(subInfo.label)
        .setDescription(`${lesson.beginTime} - ${lesson.endTime} | ${lesson.room}\n${lesson.subjectName}${lesson.group?` | ${lesson.group}`:``}\n${lesson.teacher}`)
      try {
        await user.send({
          embeds: [lukMomIhaveEmbed]
        });
        cli.ok(`Sent notification "${subInfo.label}" to user ${user?.tag} ( <@${subInfo.userID}> )`);
      } catch(e) {
        cli.error(`Sending notification to user ${user?.tag} ( <@${subInfo.userID}> ) failed:
    ${e.message}`);
      }
    }
  }
  closestNotification();
}

function closestNotification() {
  var d = new Date();
  for (var i = 0; i < times.length; i++) {
    var tt = times[i].endtime.split(':');
    var d2 = new Date();
    d2.setHours(tt[0]);
    d2.setMinutes(tt[1]);
    d2.setSeconds(0);
    d2.setMilliseconds(0);

    var diff = d2.getTime() - d.getTime();

    if (diff > 1000) {
      setTimeout(stalk, diff);
      nextLesson = times[i].sequence + 1;
      return;
    }
  }
  setTimeout(closestNotification, 6 * 60 * 60 * 1000);
}
