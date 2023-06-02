const generic = require('../bakalariStalkin/util/generic.js');
const getBaseUrl = require('../bakalariStalkin/util/getBaseUrl.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');
const stalk = require('../stalk.js');
const db = require('../lib/dbpromise');
const cli = require('cli');
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Initiate a stalking session for a specific class/group.')
    .addStringOption(option => option.setName('class').setDescription('Class you want to subscribe to (for example P3.B)').setRequired(true))
    .addBooleanOption(option => option.setName('onclassstart').setDescription('Send notification on class start instead of the end').setRequired(true))
    .addStringOption(option => option.setName('groups').setDescription('Preferred groups (for example 1.sk or 1.sk 3.sk)').setRequired(false))
    .addStringOption(option => option.setName('label').setDescription('Your "genius" label').setRequired(false))
    .addStringOption(option => option.setName('server').setDescription('Base URL of your Bakalari server, default - SSSVT server').setRequired(false)),
  async execute(interaction) {
    const className = interaction.options.getString('class').toUpperCase();
    const groups = interaction.options.getString('groups')?.split(' ')
      .filter(a => a)
      .sort()
      .filter((v, i, self) => self.indexOf(v) === i) || [];
    const label = interaction.options.getString('label') || className;
    let server = interaction.options.getString('server');
    if (server) {
      server = await getBaseUrl(interaction.options.getString('server'));

      if (server === null) {
        cli.error(`Invalid server URL (${interaction.options.getString('server')}) entered by ${interaction.user.username} | ${interaction.user.id}`);
        return interaction.reply({
          content: `Invalid Bakalari server URL (${interaction.options.getString('server')})`,
          ephemeral: true,
        });
      }
      if (server === undefined) {
        cli.error(`Valid server URL (${interaction.options.getString('server')}) without public TT entered by ${interaction.user.username} | ${interaction.user.id}`);
        return interaction.reply({
          content: 'Unfortunately this Bakalari server is not supported',
          ephemeral: true,
        });
      }
    }
    else {
      server = 'https://is.sssvt.cz/IS/Timetable/Public';
    }

    await updateClassIDs(server);

    const onClassStart = interaction.options.getBoolean('onclassstart');

    if (!(await generic.getClassInfo(className, false, server))) {
      cli.error(`Incorrect class (${className}, ${server}) entered by ${interaction.user.username} | ${interaction.user.id}`);
      return interaction.reply({
        content: `Incorrect class: ${className}`,
        ephemeral: true,
      });
    }
    for (let i = 0; i < groups.length; i++) {
      if (!/^[1-4].sk$/.test(groups[i])) {
        cli.error(`Incorrect group (${groups[i]}) entered by ${interaction.user.username} | ${interaction.user.id}`);
        return interaction.reply({
          content: `Incorrect group: ${groups[i]}`,
          ephemeral: true,
        });
      }
    }
    const args = [interaction.user.id, (await generic.getClassInfo(className, false, server)).id, JSON.stringify(groups), 0, label, server, onClassStart ? 1 : 0];
    if (process.env.NODE_ENV == 'development') {console.log('sub args', args);}
    const result = await db.run('INSERT INTO subscriptions(userID, classID, groups, pausedUntil, label, bakaServer, notificationOnClassStart) values(?, ?, ?, ?, ?, ?, ?)', args);

    await stalk.initSubscription(result.lastID);

    cli.ok(`${interaction.user.username} started stalking ${className} (ID: ${(await generic.getClassInfo(className, false, server)).id}) ${groups}, server: ${server} | ID: ${interaction.user.id}`);
    return interaction.reply({
      content: 'Successfully started stalking! :sunglasses:',
      ephemeral: true,
    });
  },
};
