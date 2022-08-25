const fs = require('fs');
const cli = require('cli');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const utils = require('./bakalariStalkin/util/generic.js');
const db = require("./lib/dbpromise");
const {
  MessageEmbed
} = require('discord.js');

module.exports.stalk = stalk;

async function stalk() {
  var subscriptions = {};
  var classes = new Set();
  var timetables = {};

  await updateTTs();

  await fetchSubscriptions();

  console.log(subscriptions);

  for (subscription of Object.values(subscriptions)) {
    planNotification(subscription);
  }

  async function updateTTs() {
    for (let item of classes) {
      try {
        await updateTT(item);
      } catch (e) {
        cli.error(e);
      }
      setTimeout(updateTT, 15 * 60 * 1000);
    }
  }

  async function updateTT(item) {
    if (!timetables[item]) {
      timetables[item] = {
        timetable: []
      };
    }
    if (Date.now() - timetables[item].lastUpdate < 5 * 60 * 1000) {
      return;
    }
    timetables[item].lastUpdate = Date.now();
    var parts = item.split("\0");
    var timetable = await getTT(parts[1], parts[0]);
    timetables[item].timetable = timetable;
  }

  async function fetchSubscriptions() {
    subs = await db.all("SELECT * FROM subscriptions");
    for (let item of subs) {
      item.groups = JSON.parse(item.groups);
      subscriptions[item.id] = {
        info: item,
        lastCheck: Date.now()
      };
      var classString = `${item.bakaServer}\0${item.classID}`
      classes.add(classString);
      await updateTT(classString);
    }
  }

  async function planNotification(subscription, lastTimeout) {
    const maxTimeout = 60 * 60 * 1000;
    var now = Date.now();
    var lastCheck = subscription.lastCheck;
    subscription.lastCheck = now;

    var timetable = timetables[`${subscription.info.bakaServer}\0${subscription.info.classID}`].timetable
      .filter(utils.filterGroups(subscription.info.groups))
      .filter(atom => atom.endTimestamp > lastCheck)
      .sort((a, b) => a.endTimestamp - b.endTimestamp);

    var pastEvents = timetable.filter(atom => atom.endTimestamp <= now);
    var upcomingEvents = timetable.filter(atom => atom.endTimestamp > now);

    for (let event of upcomingEvents) {
      sendNotification(subscription, event);
    }

    var timeout = upcomingEvent ? Math.min(upcomingEvent.endTimestamp - now, maxTimeout) : maxTimeout;
    if (lastTimeout == maxTimeout && timeout != maxTimeout) {
      timeout-= 10 * 60 * 1000;
    }
    setTimeout(() => planNotification(subscription, timeout), timeout);
  }

  async function sendNotification(subscription, event) {
    var user = await module.exports.client.users.fetch(subscription.info.userID);
    const lukMomIhaveEmbed = new MessageEmbed()
      .setColor(event.changeinfo !== "" ? '#ff3300' : '#0099ff')
      .setTitle(subscription.info.label)
      .setDescription(`${event.beginTime} - ${event.endTime} | ${event.room}\n${event.subjectName}${event.group?` | ${event.group}`:``}\n${event.teacher}`)
    try {
      await user.send({
        embeds: [lukMomIhaveEmbed]
      });
      cli.ok(`Sent notification "${subscription.info.label}" to user ${user?.tag} ( <@${subscription.info.userID}> )`);
    } catch (e) {
      cli.error(`Sending notification to user ${user?.tag} ( <@${subscription.info.userID}> ) failed:
    ${e.message}`);
    }
  }
}