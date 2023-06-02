const db = require('../lib/dbpromise');
const getBaseUrl = require('../bakalariStalkin/util/getBaseUrl.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');
const generic = require('../bakalariStalkin/util/generic.js');

module.exports = async function(req, res) {
  const { user } = req.session;

  const data = req.body;

  if (data.step == 0) {
    return res.status(200).json({
      step: 1,
      bakaServer: req.body.bakaServer,
    });
  }

  if (data.step == 1) {
    const bakaServer = await getBaseUrl(req.body.bakaServer);

    if (bakaServer === null || bakaServer === undefined) {
      return res.status(400).json({
        error: 'E_BAD_BAKA_SERVER',
        message: 'Provided Bakaláři server is not valid',
        step: 1,
      });
    }

    return res.status(200).json({
      step: 2,
      bakaServer: bakaServer,
      classes: await updateClassIDs.fetchPairs(bakaServer),
    });
  }

  if (data.step == 2) {
    const className = data.className;
    const bakaServer = data.bakaServer;
    if (!className) {
      return res.status(400).json({
        error: 'E_BAD_CLASS_NAME',
        message: 'Provided class is not valid',
        step: 1,
      });
    }

    let possible_groups = [];
    try {
      possible_groups = await generic.getPossibleGroups(
        className,
        true,
        bakaServer,
      );
    }
    catch (e) {
      console.log(e);
      return res.status(400).json({
        error: 'E_BAD_CLASS_NAME',
        message: 'Provided class is not valid',
        step: 1,
      });
    }
    return res.status(200).json({
      step: 3,
      bakaServer: bakaServer,
      classes: await updateClassIDs.fetchPairs(bakaServer),
      groups: possible_groups,
      className: className,
    });
  }

  if (data.step == 3) {
    let groups = data.groups;
    const className = data.className;
    const bakaServer = data.bakaServer;

    const possible_groups = await generic.getPossibleGroups(
      className,
      true,
      bakaServer,
    );

    if (!groups) {
      groups = [];
    }

    if (!Array.isArray(groups)) {
      if (groups != '') {
        groups = [groups];
      }
      else {
        groups = [];
      }
    }

    if (groups.length != 0) {
      for (const group of groups) {
        if (!possible_groups.includes(group)) {
          return res.status(400).json({
            error: 'E_BAD_GROUPS',
            message: 'Provided groups are not valid',
            step: 1,
          });
        }
      }
    }

    db.run(
      'UPDATE userSettings SET className = ?, groups = ?, bakaServer = ?, dailyNotification = 0 WHERE userID = ? AND platform = ?',
      [className, JSON.stringify(groups), bakaServer, user.id, user.platform],
    );
  }
  return res.status(303).json({
    redirect: '/settings',
  });
};
