const cli = require('cli');
const getTT = require('./bakalariStalkin/util/getClassTT.js');
const utils = require('./bakalariStalkin/util/generic.js');
const db = require('./lib/dbpromise');
const {markdownv2: format} = require('telegram-format');
const {
  MessageEmbed,
} = require('discord.js');
module.exports.stalk = stalk;

async function stalk() {
  module.exports.initSubscription = initSubscription;

  const subscriptions = {};
  const classes = new Set();
  const timetables = {};

  module.exports.timetables = timetables;

  await updateTTs();

  await fetchSubscriptions();

  for (const subscription of Object.values(subscriptions)) {
    await planNotification(subscription);
  }

  async function initSubscription(subscriptionID) {
    const subscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', subscriptionID);
    subscription.groups = JSON.parse(subscription.groups);
    subscriptions[subscription.id] = {
      info: subscription,
      lastCheck: Date.now(),
    };
    const classString = `${subscription.bakaServer}\0${subscription.classID}`;
    classes.add(classString);
    await updateTT(classString);
    await planNotification(subscriptions[subscription.id]);
  }

  async function updateTTs() {
    try {
      const start = performance.now();
      let successes = 0, fails = 0;
      for (const item of classes) {
        try {
          await updateTT(item);
          successes++;
        }
        catch (e) {
          cli.error(e);
          fails++;
        }
      }
      cli.info(`Updated ${successes} TTs, ${fails} failed in ${~~(performance.now() - start)}ms`);
    }
    catch (e) {
      console.log('SANITY: updateTTs failed to catch error!');
    }
    setTimeout(updateTTs, 15 * 60 * 1000);
  }

  async function updateTT(item) {
    if (!timetables[item]) {
      timetables[item] = {
        timetable: [],
      };
    }
    if (Date.now() - timetables[item].lastUpdate < 5 * 60 * 1000) {
      return;
    }
    timetables[item].lastUpdate = Date.now();
    const parts = item.split('\0');
    const timetable = await getTT(parts[1], parts[0]);
    timetables[item].timetable = timetable;
  }

  async function fetchSubscriptions() {
    const subs = await db.all('SELECT * FROM subscriptions');
    for (const item of subs) {
      item.groups = JSON.parse(item.groups);
      subscriptions[item.id] = {
        info: item,
        lastCheck: Date.now(),
      };
      const classString = `${item.bakaServer}\0${item.classID}`;
      classes.add(classString);
      await updateTT(classString);
    }
  }

  async function planNotification(subscription, lastTimeout) {
    if (process.env.NODE_ENV == 'development') {console.log('planNotification', {subscription, lastTimeout});}
    const maxTimeout = 60 * 60 * 1000;
    const firstOffset = 10 * 60 * 1000;
    const now = Date.now();
    const lastCheck = subscription.lastCheck;
    subscription.lastCheck = now;
    const updatedSub = await db.all('SELECT * FROM subscriptions WHERE id = ?', subscription.info.id);
    if (updatedSub.length == 0) {
      return;
    }
    subscription.info = updatedSub[0];
    subscription.info.groups = JSON.parse(subscription.info.groups);
    let timeout = 0;

    const timetable = timetables[`${subscription.info.bakaServer}\0${subscription.info.classID}`].timetable
      .filter(utils.filterGroups(subscription.info.groups))
      .sort((a, b) => a.endTimestamp - b.endTimestamp);

    if (subscription.info.notificationOnClassStart == 0) {
      const upcomingEvents = timetable.filter(atom => atom.endTimestamp > now);

      if (upcomingEvents.length == 0) {
        timeout = maxTimeout;
        cli.info(`Setting timeout for ${timeout}ms`);
        setTimeout(() => planNotification(subscription, timeout), timeout);
        return;
      }

      const upcomingEvent = upcomingEvents[0];

      if (upcomingEvent.beginTimestamp < now && now < upcomingEvent.endTimestamp) {
        timeout = upcomingEvent.endTimestamp - now;
        cli.info(`Setting timeout for ${timeout}ms`);
        setTimeout(() => planNotification(subscription, timeout), timeout);
        return;
      }

      if (lastTimeout == maxTimeout && upcomingEvent.beginTimestamp - now < maxTimeout) {
        timeout = upcomingEvent.beginTimestamp - now - firstOffset;
        cli.info(`Setting timeout for ${timeout}ms`);
        setTimeout(() => planNotification(subscription, timeout), timeout);
        return;
      }

      if (upcomingEvent.beginTimestamp - now < maxTimeout) {
        const events = upcomingEvents.filter(atom => atom.beginTimestamp == upcomingEvent.beginTimestamp);
        if (process.uptime() > 5) {
          for (const event of events) {
            sendNotification(subscription, event);
          }
        }
        timeout = Math.min(upcomingEvent.endTimestamp - now, maxTimeout);
        cli.info(`Setting timeout for ${timeout}ms`);
        setTimeout(() => planNotification(subscription, timeout), timeout);
      }
      else {
        timeout = Math.min(upcomingEvent.beginTimestamp - now - firstOffset, maxTimeout);
        cli.info(`Setting timeout for ${timeout}ms`);
        setTimeout(() => planNotification(subscription, timeout), timeout);
      }
    }
    else {
      const pastEvents = timetable.filter(atom => atom.beginTimestamp > lastCheck && atom.beginTimestamp <= now);
      const upcomingEvents = timetable.filter(atom => atom.beginTimestamp > now);

      const upcomingEvent = upcomingEvents[0];

      for (const event of pastEvents) {
        sendNotification(subscription, event);
      }

      timeout = upcomingEvents ? Math.min(upcomingEvent.beginTimestamp - now, maxTimeout) : maxTimeout;

      cli.info(`Setting timeout for ${timeout}ms`);
      setTimeout(() => planNotification(subscription, timeout), timeout);
    }
  }

  async function sendNotification(subscription, event) {
    const telegram = require('./index').telegram;
    const matrix = require('./index').matrix;

    if (subscription.info.pausedUntil > Date.now()) {
      return;
    }
    switch (subscription.info.platform) {
      case 0: // Discord
        const user = await module.exports.client.users.fetch(subscription.info.userID);
        const lukMomIhaveEmbed = new MessageEmbed()
          .setColor(event.changeinfo !== '' ? '#ff3300' : '#0099ff')
          .setTitle(subscription.info.label)
          .setDescription(`${event.beginTime} - ${event.endTime} | ${event.room}\n${event.subjectName}${event.group ? ` | ${event.group}` : ''}\n${event.teacher}`);
        try {
          await user.send({
            embeds: [lukMomIhaveEmbed],
          });
          cli.ok(`Sent notification "${subscription.info.label}" to user ${user?.username} ( <@${subscription.info.userID}> )`);
        }
        catch (e) {
          cli.error(`Sending notification to user ${user?.username} ( <@${subscription.info.userID}> ) failed:
        ${e.message}`);
        }
        break;
      case 1: // Telegram
        const TgMessage = `
          ${format.bold(format.escape(subscription.info.label))}\n${format.escape(event.beginTime)} \\- ${format.escape(event.endTime)} \\| ${format.escape(event.room)}\n${format.escape(event.subjectName)}${event.group ? ` \\| ${format.escape(event.group)}` : ''}\n${format.escape(event.teacher)}\n${event.changeinfo == '' ? '' : format.escape(event.changeinfo)}`;
        try {
          telegram.telegram.sendMessage(subscription.info.userID, {text: TgMessage, parse_mode: 'MarkdownV2' });
          cli.ok(`Sent notification "${subscription.info.label}" to user ${subscription.info.userID}`);
        }
        catch (e) {
          cli.error(`Sending notification to user ${subscription.info.userID} failed:
        ${e.message}`);
        }
        break;
      case 2: // Matrix
        const MxMessage = `**${subscription.info.label}**\n${event.beginTime} - ${event.endTime} | ${event.room}\n${event.subjectName}${event.group ? ` | ${event.group}` : ''}\n${event.teacher}\n*${event.changeinfo == '' ? '' : event.changeinfo}*`;
        const MxMessageHTML = `<strong>${subscription.info.label}</strong><br>${event.beginTime} - ${event.endTime} | ${event.room}<br>${event.subjectName}${event.group ? ` | ${event.group}` : ''}<br>${event.teacher}<br><i>${event.changeinfo == '' ? '' : event.changeinfo}</i>`;
        try {
          matrix.sendMessage(subscription.info.userID, {
            'msgtype': 'm.text',
            'body': MxMessage,
            'format': 'org.matrix.custom.html',
            'formatted_body': MxMessageHTML,
          });
        }
        catch (e) {
          cli.error(`Sending notification to user ${subscription.info.userID} failed:
        ${e.message}`);
        }
        break;
      default:
        cli.error(`Unknown platform ${subscription.info.platform}. Sub ID: ${subscription.info.id}`);
        break;
    }
  }
}
