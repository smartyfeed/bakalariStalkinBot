const generic = require('../bakalariStalkin/util/generic.js');

module.exports = async function(req, res) {
  var data = req.body;
  var groups = [];

  try {
    groups = await generic.getPossibleGroups(data.className, true, data.bakaServer);
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      error: "E_BAD_CLASS_NAME",
      message: "Provided class is not valid",
    });
  }
  res.json(groups);
}