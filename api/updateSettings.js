const db = require("../lib/dbpromise");
const getBaseUrl = require("../bakalariStalkin/util/getBaseUrl.js");
const generic = require("../bakalariStalkin/util/generic.js");

module.exports = async function (req, res) {
  var { user } = req.session;

  var bakaServer = await getBaseUrl(req.body.bakaServer);

  if (bakaServer === null || bakaServer === undefined) {
    return res.status(400).json({
      error: "E_BAD_BAKA_SERVER",
      message: "Provided Bakaláři server is not valid",
    });
  }
  var className = req.body.className;
  if (className === null) {
    return res.status(400).json({
      error: "E_BAD_CLASS_NAME",
      message: "Provided class is not valid",
    });
  }
  className = className.toUpperCase();

  let possible_groups = [];
  try {
    possible_groups = await generic.getPossibleGroups(
      className,
      true,
      bakaServer
    );
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      error: "E_BAD_CLASS_NAME",
      message: "Provided class is not valid",
    });
  }

  var groups = req.body.groups;

  if (!groups) {
    groups = [];
  }

  if (!Array.isArray(groups)) {
    if (groups != "") {
      groups = [groups];
    } else {
      groups = [];
    }
  }

  if (groups.length != 0) {
    for (var group of groups) {
      if (!possible_groups.includes(group)) {
        return res.status(400).json({
          error: "E_BAD_GROUPS",
          message: "Provided groups are not valid",
        });
      }
    }
  }

  db.run(
    "UPDATE userSettings SET className = ?, groups = ?, bakaServer = ?, dailyNotification = 0 WHERE userID = ?",
    [className, JSON.stringify(groups), bakaServer, user.id]
  );

  return res.status(200).json({
    message: "OK",
  });
};
