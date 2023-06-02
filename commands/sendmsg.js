const db = require('../lib/dbpromise');
const cli = require('cli');
const {
  SlashCommandBuilder,
} = require('@discordjs/builders');
const {
  MessageEmbed,
} = require('discord.js');

module.exports = {
  hidden: true,
  data: new SlashCommandBuilder()
    .setName('sendmsg')
    .setDescription('Sends a message')
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Send message to a specified user')
        .addStringOption(option => option.setName('userid').setDescription('User ID'))
        .addUserOption(option => option.setName('username').setDescription('User discord tag'))
        .addStringOption(option => option.setName('message').setDescription('Message content'))
        .addBooleanOption(option => option.setName('embed').setDescription('Send the message in an embed?'))
        .addStringOption(option => option.setName('title').setDescription('Embed title')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Send message to a specified channel')
        .addStringOption(option => option.setName('channelid').setDescription('Channel ID'))
        .addChannelOption(option => option.setName('channelname').setDescription('Channel Name'))
        .addStringOption(option => option.setName('message').setDescription('Message content'))
        .addBooleanOption(option => option.setName('embed').setDescription('Send the message in an embed?'))
        .addStringOption(option => option.setName('title').setDescription('Embed title')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('botusers')
        .setDescription('Send message to all bot users')
        .addStringOption(option => option.setName('message').setDescription('Message content'))
        .addBooleanOption(option => option.setName('embed').setDescription('Send the message in an embed?'))
        .addStringOption(option => option.setName('title').setDescription('Embed title'))),

  async execute(interaction) {
    await module.exports.client.application.fetch();
    if (!module.exports.client.application.owner.members?.find(member => member.user.id == interaction.user.id)
      && module.exports.client.application.owner?.id != interaction.user.id) {
      return interaction.reply({
        content: 'You can not use this command',
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'user') {
      const userID = interaction.options.getString('userid') || interaction.options.getUser('username')?.id;
      if (!userID) {
        return interaction.reply({
          content: 'Please specify a user',
          ephemeral: true,
        });
      }
      const user = await module.exports.client.users.fetch(userID);

      if (!user.dmChannel) {
        try {
          await user.createDM();
        }
        catch (e) {
          cli.error(`Failed to create userDM channel with ${user.tag} | bot: ${user.bot}`);
        }
      }

      if (interaction.options.getBoolean('embed')) {
        const embed = prepareEmbed(interaction, interaction.options.getString('title'));
        const res = await sendPreview(interaction, '', embed);
        if (res.send) {
          try {
            await user.send({
              embeds: [embed],
            });
            return interaction.channel.send({
              content: 'Sent!',
              ephemeral: true,
              fetchReply: true,
            });
          }
          catch (e) {
            return interaction.channel.send({
              content: 'Failed to send message to user ' + user.username + ': ' + e,
              ephemeral: true,
              fetchReply: true,
            });
          }
        }
        else {return;}
      }
      else {
        const content = interaction.options.getString('message');
        const res = await sendPreview(interaction, content);
        if (res.send) {
          try {
            await user.send({
              content: content,
            });
            return interaction.channel.send({
              content: 'Sent!',
              ephemeral: true,
              fetchReply: true,
            });
          }
          catch (e) {
            return interaction.channel.send({
              content: 'Failed to send message to user ' + user.username + ': ' + e,
              ephemeral: true,
              fetchReply: true,
            });
          }
        }
        else {return;}
      }
    }

    if (subcommand === 'channel') {
      const channelID = interaction.options.getString('channelid') || interaction.options.getChannel('channelname')?.id;
      if (!channelID) {
        return interaction.reply({
          content: 'Please specify a channel',
          ephemeral: true,
        });
      }

      const channel = await module.exports.client.channels.fetch(channelID);

      if (interaction.options.getBoolean('embed')) {
        const embed = prepareEmbed(interaction, interaction.options.getString('title'));
        const res = await sendPreview(interaction, '', embed);
        if (res.send) {
          try {
            await channel.send({
              embeds: [embed],
            });
            return interaction.channel.send({
              content: 'Sent!',
              ephemeral: true,
              fetchReply: true,
            });
          }
          catch (e) {
            return interaction.channel.send({
              content: 'Failed to send message to channel ' + channel.id + ': ' + e,
              ephemeral: true,
              fetchReply: true,
            });
          }
        }
        else {return;}
      }
      else {
        const content = interaction.options.getString('message');
        const res = await sendPreview(interaction, content);
        if (res.send) {
          try {
            await channel.send({
              content: content,
            });
            return interaction.channel.send({
              content: 'Sent!',
              ephemeral: true,
              fetchReply: true,
            });
          }
          catch (e) {
            return interaction.channel.send({
              content: 'Failed to send message to channel ' + channel.id + ': ' + e,
              ephemeral: true,
              fetchReply: true,
            });
          }
        }
        else {return;}
      }
    }

    if (subcommand === 'botusers') {
      const users = await db.all('SELECT * FROM subscriptions');

      const distinctUsers = new Set();

      for (const user of users) {
        distinctUsers.add(user.userID);
      }

      if (distinctUsers.size == 0) {
        return interaction.reply({
          content: 'No users found',
          ephemeral: true,
        });
      }

      if (interaction.options.getBoolean('embed')) {
        const embed = prepareEmbed(interaction, interaction.options.getString('title'));
        const res = await sendPreview(interaction, '', embed);
        if (res.send) {
          for (const userID of distinctUsers) {
            const user = await module.exports.client.users.fetch(userID);
            try {
              await user.send({
                embeds: [embed],
              });
            }
            catch (e) {
              return interaction.channel.send({
                content: 'Failed to send message to channel: ' + e,
                ephemeral: true,
                fetchReply: true,
              });
            }
            return interaction.channel.send({
              content: 'Sent!',
              ephemeral: true,
              fetchReply: true,
            });
          }
        }
        else {return;}
      }
      else {
        const content = interaction.options.getString('message');
        const res = await sendPreview(interaction, content);
        if (res.send) {
          for (const userID of distinctUsers) {
            const user = await module.exports.client.users.fetch(userID);
            try {
              await user.send({
                content: content,
              });
            }
            catch (e) {
              return interaction.channel.send({
                content: 'Failed to send message to channel: ' + e,
                ephemeral: true,
                fetchReply: true,
              });
            }
            return interaction.channel.send({
              content: 'Sent!',
              ephemeral: true,
              fetchReply: true,
            });
          }
        }
        else {return;}
      }
    }
  },
};

function prepareEmbed(interaction, title) {

  const embed = new MessageEmbed()
    .setColor('#00A36C')
    .setTitle(title || 'Announcement')
    .setDescription(interaction.options.getString('message'))
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    });

  return embed;
}

async function sendPreview(interaction, content, embed) {
  let message;
  if (embed) {
    message = await interaction.reply({
      content: '**PREVIEW**',
      embeds: [embed],
      fetchReply: true,
    });
  }
  else {
    message = await interaction.reply({
      content: '**PREVIEW** \n' + content,
      fetchReply: true,
    });
  }
  try {
    await message.react('✅');
    await message.react('❌');
  }
  catch (error) {
    console.error('One of the emojis failed to react:', error);
  }

  const filter = (reaction, user) => {
    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === interaction.user.id;
  };

  const res = message.awaitReactions({
    filter,
    max: 1,
    time: 60000,
    errors: ['time'],
  })
    .then(async function(collected) {
      const reaction = collected.first();

      if (reaction.emoji.name === '✅') {
        return ({
          send: true,
          embed,
        });
      }
      else {
        message.reply('Aborting.');
        return ({
          send: false,
        });
      }
    })
    .catch(() => {
      message.reply('No reaction. Aborting');
    });

  return res;
}
