const fs = require('fs');

module.exports = function(db) {
  db.run("CREATE TABLE IF NOT EXISTS subscriptions (userID TEXT, className TEXT, groups TEXT, pausedUntil INT, label TEXT)");
  if(fs.existsSync("subscriptions.json")) {
    var { subscriptions } = JSON.parse(fs.readFileSync("subscriptions.json"));
    var query = db.prepare("INSERT INTO subscriptions values(?, ?, ?, ?, ?)");
    subscriptions.forEach(subscription => {
      query.run(subscription.userID, subscription.className, JSON.stringify(subscription.groups), subscription.pausedUntil || 0, subscription.label);
      console.log("Inserted subscription", subscription.label);
    });
    fs.unlinkSync("subscriptions.json");
  }
};