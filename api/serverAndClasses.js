const generic = require('../bakalariStalkin/util/generic.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');
const getBaseUrl = require("../bakalariStalkin/util/getBaseUrl.js");

module.exports = async function(req, res) {
  var bakaServer = await getBaseUrl(req.body.bakaServer);

  if (bakaServer === null || bakaServer === undefined) {
    return res.status(400).json({
      error: "E_BAD_BAKA_SERVER",
      message: "Provided Bakaláři server is not valid",
    });
  }

  var classes = await updateClassIDs.fetchPairs(bakaServer);
  
  res.json({bakaServer: bakaServer, classes: classes});
}