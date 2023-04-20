const db = require("../lib/dbpromise");
const getBaseUrl = require("../bakalariStalkin/util/getBaseUrl.js");
const generic = require("../bakalariStalkin/util/generic.js");

module.exports = async function (req, res) {
  var { user } = req.session;

  var bakaServer = await getBaseUrl(req.body.bakaServer);

  var className = req.body.className.toUpperCase();
  
  var groups =
    req.body.groups
      ?.replace(/,/g, "")
      .split(" ")
      .filter((a) => a)
      .sort()
      .filter((v, i, self) => self.indexOf(v) === i) || [];

  if (bakaServer === null || bakaServer === undefined) {
    return res.status(400).json({
      error: "E_BAD_BAKA_SERVER",
      message: "Provided Bakaláři server is not valid",
    });
  }

  if (!generic.getClassInfo(className, false, bakaServer)) {
    return res.status(400).json({
      error: "E_BAD_CLASS_NAME",
      message: "Provided class is not valid",
    });
  }

  for (var i = 0; i < groups.length; i++) {
    if (!/^[1-4].sk$/.test(groups[i])) {
      return res.status(400).json({
        error: "E_BAD_GROUPS",
        message: "Provided group is not valid",
      });
    }

    db.run("UPDATE userSettings SET className = ?, groups = ?, bakaServer = ?, dailyNotification = 0 WHERE userID = ?", [className, JSON.stringify(groups), bakaServer, user.id]);

    return res.status(200).json({
      message: "OK",
    });
  }
}
