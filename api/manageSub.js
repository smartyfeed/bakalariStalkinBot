const db = require('../lib/dbpromise');
const getBaseUrl = require('../bakalariStalkin/util/getBaseUrl.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');
const generic = require('../bakalariStalkin/util/generic.js');
const stalk = require('../stalk.js');

module.exports = async function(req, res) {
  const { user } = req.session;

  const data = req.body;

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

    let groups = data.groups;

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
    return res.status(200).json({
      step: 4,
      bakaServer: bakaServer,
      classes: await updateClassIDs.fetchPairs(bakaServer),
      groups: possible_groups,
      selectedGroups: groups,
      className: className,
    });
  }

  if (data.step == 4) {
    let groups = data.groups;
    const className = data.className;
    const bakaServer = data.bakaServer;
    const notificationOnClassStart = data.notificationOnClassStart;
    let label = data.label;
    const oldId = data.oldId;

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

    if (!label) {
      label = className;
    }

    if (oldId != 'new') {
      db.run('DELETE FROM subscriptions WHERE id = ?', [oldId]);
    }

    const result = await db.run(
      'INSERT INTO subscriptions (userID, classID, groups, pausedUntil, label, bakaServer, notificationOnClassStart, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        user.id,
        (await generic.getClassInfo(className, false, bakaServer)).id,
        JSON.stringify(groups),
        0,
        label,
        bakaServer,
        notificationOnClassStart ? 1 : 0,
        user.platform,
      ],
    );

    await stalk.initSubscription(result.lastID);
  }
  return res.status(303).json({
    redirect: '/',
  });
};
