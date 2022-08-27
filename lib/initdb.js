const fs = require('fs');
const generic = require('../bakalariStalkin/util/generic.js');

module.exports = function(db) {
  db.run("CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, userID TEXT, classID TEXT, groups TEXT, pausedUntil INT, label TEXT, bakaServer TEXT, notificationOnClassStart INT)");
  if(fs.existsSync("subscriptions.json")) {
    var { subscriptions } = JSON.parse(fs.readFileSync("subscriptions.json"));
    var query = db.prepare("INSERT INTO subscriptions(userID, classID, groups, pausedUntil, label, bakaServer, notificationOnClassStart) values(?, ?, ?, ?, ?, ?, ?)");
    subscriptions.forEach(subscription => {
      if(!subscription.bakaServer) {
        subscription.bakaServer = "https://is.sssvt.cz/IS/Timetable/Public";
      }
      query.run(subscription.userID, generic.getClassInfo(subscription.className, false, subscription.bakaServer).id, JSON.stringify(subscription.groups), subscription.pausedUntil || 0, subscription.label, subscription.bakaServer, subscription.notificationOnClassStart || 0);
      console.log("Inserted subscription", subscription.label);
    });
    fs.unlinkSync("subscriptions.json");
  }
};