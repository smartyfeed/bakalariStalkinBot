const cli = require('cli');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const utils = require('./bakalariStalkin/util/generic.js');
const db = require("./lib/dbpromise");
const {
  MessageEmbed
} = require('discord.js');
module.exports.stalk = stalk;

async function stalk() {
  module.exports.initSubscription = initSubscription;

  var subscriptions = {};
  var classes = new Set();
  var timetables = {};


  await updateTTs();

  await fetchSubscriptions();

  for (subscription of Object.values(subscriptions)) {
    await planNotification(subscription);
  }

  async function initSubscription(subscriptionID) {
    let subscription = await db.get("SELECT * FROM subscriptions WHERE id = ?", subscriptionID);
    subscription.groups = JSON.parse(subscription.groups);
    subscriptions[subscription.id] = {
      info: subscription,
      lastCheck: Date.now()
    };
    let classString = `${subscription.bakaServer}\0${subscription.classID}`
    classes.add(classString);
    await updateTT(classString);
    await planNotification(subscriptions[subscription.id]);
  }

  async function updateTTs() {
    for (let item of classes) {
      try {
        await updateTT(item);
      } catch (e) {
        cli.error(e);
      }
      setTimeout(updateTTs, 15 * 60 * 1000);
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
    let parts = item.split("\0");
    let timetable = await getTT(parts[1], parts[0]);
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
      let classString = `${item.bakaServer}\0${item.classID}`
      classes.add(classString);
      await updateTT(classString);
    }
  }

  async function planNotification(subscription, lastTimeout) {
    const maxTimeout = 60 * 60 * 1000;
    const firstOffset = 10 * 60 * 1000;
    let now = Date.now();
    let lastCheck = subscription.lastCheck;
    subscription.lastCheck = now;
    let updatedSub = await db.all("SELECT * FROM subscriptions WHERE id = ?", subscription.info.id);
    if (updatedSub.length == 0) {
      return;
    }
    subscription.info = updatedSub[0];
    var timeout = 0;

    var timetable = timetables[`${subscription.info.bakaServer}\0${subscription.info.classID}`].timetable
      .filter(utils.filterGroups(subscription.info.groups))
      .sort((a, b) => a.endTimestamp - b.endTimestamp);

    if (subscription.info.notificationOnClassStart == 0) {
      let upcomingEvents = timetable.filter(atom => atom.endTimestamp > now);

      if (upcomingEvents.length == 0) {
        timeout = maxTimeout;
        setTimeout(() => planNotification(subscription, timeout), timeout);
        return;
      }

      var upcomingEvent = upcomingEvents[0];

      if (upcomingEvent.beginTimestamp < now && now < upcomingEvent.endTimestamp) {
        timeout = upcomingEvent.endTimestamp - now;
        setTimeout(() => planNotification(subscription, timeout), timeout);
        return;
      }

      if (lastTimeout == maxTimeout && upcomingEvent.beginTimestamp - now < maxTimeout) {
        timeout = upcomingEvent.beginTimestamp - now - firstOffset;
        setTimeout(() => planNotification(subscription, timeout), timeout);
        return;
      }

      if (upcomingEvent.beginTimestamp - now < maxTimeout) {
        let events = upcomingEvents.filter(atom => atom.beginTimestamp == upcomingEvent.beginTimestamp);
        if (process.uptime() > 5) {
          for (let event of events) {
            sendNotification(subscription, event);
          }
        }
        timeout = Math.min(upcomingEvent.endTimestamp - now, maxTimeout);
        setTimeout(() => planNotification(subscription, timeout), timeout);
      } else {
        timeout = Math.min(upcomingEvent.beginTimestamp - now - firstOffset, maxTimeout);
        setTimeout(() => planNotification(subscription, timeout), timeout);
      }
    } else {
      let pastEvents = timetable.filter(atom => atom.beginTimestamp > lastCheck && atom.beginTimestamp <= now);
      let upcomingEvents = timetable.filter(atom => atom.beginTimestamp > now);

      let upcomingEvent = upcomingEvents[0];

      for (let event of pastEvents) {
        sendNotification(subscription, event);
      }

      timeout = upcomingEvents ? Math.min(upcomingEvent.beginTimestamp - now, maxTimeout) : maxTimeout;

      setTimeout(() => planNotification(subscription, timeout), timeout);
    }
  }

  async function sendNotification(subscription, event) {
    if (subscription.info.pausedUntil > Date.now()) {
      return;
    }
    let user = await module.exports.client.users.fetch(subscription.info.userID);
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