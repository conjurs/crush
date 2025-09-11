const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'modlogs',
    description: 'Set up or disable moderation logging for the server',
    aliases: ['logs', 'moderation'],
    permissions: [PermissionFlagsBits.ManageGuild],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('You don\'t have permission to manage server settings!');
        }

        if (!args[0]) {
            return message.reply('Usage: `,modlogs <channel>` or `,modlogs off`\nExample: `,modlogs #mod-logs`');
        }

        if (args[0].toLowerCase() === 'off') {
            const database = require('../database');
            await database.setGuildSetting(message.guild.id, 'mod_log_channel_id', null);
            message.reply('Moderation logging has been disabled!');
            return;
        }

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        
        if (!channel) {
            return message.reply('Please provide a valid channel!');
        }

        const database = require('../database');
        await database.setGuildSetting(message.guild.id, 'mod_log_channel_id', channel.id);

        message.reply(`moderation actions made with crush will be logged to ${channel}.`);
    }
};
