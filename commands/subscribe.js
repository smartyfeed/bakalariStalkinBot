const generic = require('../bakalariStalkin/util/generic.js');
const cli = require('cli');
const cliui = require('cliui');
const {
  SlashCommandBuilder
} = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Initiate a stalking session for a specific class/group.')
    .addStringOption(option => option.setName('class').setDescription('Class you want to subscribe to (for example P3.B)').setRequired(true))
    .addStringOption(option => option.setName('groups').setDescription('Preferred groups (for example 1.sk or 1.sk 3.sk)').setRequired(false))
    .addStringOption(option => option.setName('label').setDescription('Your "genius" label').setRequired(false)),
  async execute(interaction) {
    const className = interaction.options.getString('class').toUpperCase();
    const groups = interaction.options.getString('groups')?.split(" ")
      .filter(a => a)
      .sort()
      .filter((v, i, self) => self.indexOf(v) === i) || [];
    const label = interaction.options.getString('label') || className;

    if (!generic.getClassInfo(className)) {
      cli.error(`Incorrect class (${className}) entered by ${interaction.user.username} | ${interaction.user.id}`)
      return interaction.reply({ content: `Incorrect class: ${className}`, ephemeral: true });
    }
    for (var i = 0; i < groups.length; i++) {
      if (!/^[1-4].sk$/.test(groups[i])) {
        cli.error(`Incorrect group (${groups[i]}) entered by ${interaction.user.username} | ${interaction.user.id}`)
        return interaction.reply({ content: `Incorrect group: ${groups[i]}`, ephemeral: true });
      }
    }
    var entry = {
      userID: interaction.user.id,
      className,
      groups,
      label
    };

    var save = JSON.parse(fs.readFileSync("./subscriptions.json", "UTF8"));
    var index = save.subscriptions.findIndex(entry => entry.userID === interaction.user.id && entry.className === className && entry.groups.join(' ') === groups.join(' '));

    if (index != -1) {
      return interaction.reply({ content: `Active stalking session for ${className} ${groups} already exists! | Label: ${save.subscriptions[index].label}`, ephemeral: true });
    }

    save.subscriptions.push(entry);
    fs.writeFileSync("./subscriptions.json", JSON.stringify(save, null, 2));
    cli.ok(`${interaction.user.username} started stalking ${className} ${groups} | ID: ${interaction.user.id}`)
    return interaction.reply({ content: `Successfully started stalking! :sunglasses:`, ephemeral: true });
  },
};
