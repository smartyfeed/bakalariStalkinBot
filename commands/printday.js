const getTT = require('../bakalariStalkin/util/getClassTT.js');
const updateClassIDs = require('../bakalariStalkin/util/updateClassIDs.js');
const utils = require('../bakalariStalkin/util/generic.js');
const cli = require('cli');
const cliui = require('cliui');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const {
  MessageEmbed
} = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('printday')
    .setDescription('Show whole timetable for today')
    .addStringOption(option => option.setName('class').setDescription('Class you want (for example P3.B)').setRequired(true))
    .addStringOption(option => option.setName('groups').setDescription('Preferred groups (for example 1.sk or 1.sk 3.sk)').setRequired(false))
    .addIntegerOption(option => option.setName('offset').setDescription('Offset in days (for example yesterday = -1, tomorrow = 1)').setRequired(false)),
  async execute(interaction) {
    const className = interaction.options.getString('class').toUpperCase();
    const offset = interaction.options.getInteger('offset');
    const groups = interaction.options.getString('groups')?.split(" ")
      .filter(a => a)
      .sort()
      .filter((v, i, self) => self.indexOf(v) === i) || [];

    await updateClassIDs();
    if (!(await utils.getClassInfo(className))) {
      cli.error(`Incorrect class (${className}) entered by ${interaction.user.username} | ${interaction.user.id}`)
      return interaction.reply({
        content: `Incorrect class: ${className}`,
        ephemeral: true
      });
    }
    for (var i = 0; i < groups.length; i++) {
      if (!/^[1-4].sk$/.test(groups[i])) {
        cli.error(`Incorrect group (${groups[i]}) entered by ${interaction.user.username} | ${interaction.user.id}`)
        return interaction.reply({
          content: `Incorrect group: ${groups[i]}`,
          ephemeral: true
        });
      }
    }
    var rozvrh = await getTT(await utils.getClassInfo(className).id);
    var day = rozvrh
      .filter(atom => atom.dayOfWeekAbbrev == utils.dayOfWeekAbbrev(offset ? offset : 0))
      .filter(utils.filterGroups(groups));

    const lukMomIhaveTTEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(groups ? `${className} ${groups}` : className)

    for (var j = 1; j <= 12; j++) {
      var lesson = day.filter(atom => atom.period == j);
      if(lesson.length == 0) continue;
	  var contents = "";
	  var titulek = `${lesson[0].period} | ${lesson[0].beginTime} - ${lesson[0].endTime}`
      for (var item of lesson) {
        contents += `${item.group?`**${item.group} -** `:""}${item.subjectName} | ${item.room}\n${item.teacher}\n`;
	  }
	  lukMomIhaveTTEmbed.addField(titulek, contents, false);
    }
    cli.ok(`${interaction.user.username} looked for ${className} ${groups?`${groups} `:""}timetable | ID: ${interaction.user.id}`)
    return interaction.reply({
      embeds: [lukMomIhaveTTEmbed],
      ephemeral: true
    });
  },
};
