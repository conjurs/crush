const { PermissionFlagsBits } = require('discord.js');
const database = require('../database');

module.exports = {
    name: 'sticky',
    description: 'Set or toggle sticky messages in the channel',
    aliases: ['sticky'],
    permissions: [PermissionFlagsBits.ManageMessages],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('You don\'t have permission to manage messages!');
        }

        if (!args[0]) {
            return message.reply('Use "sticky on/off" or "sticky set <message>"');
        }

        const action = args[0].toLowerCase();

        if (action === 'on') {
            if (message.client.stickyMessages && message.client.stickyMessages.has(message.channel.id)) {
                return message.reply('Sticky messages are already on!');
            }

            if (!message.client.stickyMessages) {
                message.client.stickyMessages = new Map();
            }

            const dbData = await database.getStickyMessage(message.guild.id, message.channel.id);
            let stickyData = {
                enabled: true,
                message: dbData ? dbData.message : null,
                lastMessageId: dbData ? dbData.last_message_id : null,
                lastStickyTime: dbData ? dbData.last_sticky_time : 0
            };

            message.client.stickyMessages.set(message.channel.id, stickyData);

            await database.setStickyMessage(message.guild.id, message.channel.id, stickyData.message || '', true, stickyData.lastMessageId, stickyData.lastStickyTime);

            message.reply('Sticky messages turned on in this channel!');
        } else if (action === 'off') {
            if (!message.client.stickyMessages || !message.client.stickyMessages.has(message.channel.id)) {
                return message.reply('Sticky messages are not on!');
            }

            const stickyData = message.client.stickyMessages.get(message.channel.id);
            if (stickyData && stickyData.lastMessageId && stickyData.lastMessageId !== 'null') {
                try {
                    const lastMessage = await message.channel.messages.fetch(stickyData.lastMessageId);
                    await lastMessage.delete();
                } catch (error) {
                    console.log('Could not delete last sticky message:', error.message);
                }
            }

            message.client.stickyMessages.delete(message.channel.id);
            
            await database.removeStickyMessage(message.guild.id, message.channel.id);
            
            message.reply('Sticky messages turned off in this channel!');
        } else if (action === 'set') {
            if (!args[1]) {
                return message.reply('Give me a message to sticky!');
            }

            const stickyText = args.slice(1).join(' ');

            if (!message.client.stickyMessages) {
                message.client.stickyMessages = new Map();
            }

            if (!message.client.stickyMessages.has(message.channel.id)) {
                message.client.stickyMessages.set(message.channel.id, {
                    enabled: true,
                    message: null,
                    lastMessageId: null,
                    lastStickyTime: 0
                });
            }

            const stickyData = message.client.stickyMessages.get(message.channel.id);
            stickyData.message = stickyText;

            await database.setStickyMessage(message.guild.id, message.channel.id, stickyText, true, null, 0);

            message.reply('Sticky message set!');
        } else {
            message.reply('Use "sticky on/off" or "sticky set <message>"');
        }
    }
};
