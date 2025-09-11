const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Locks the current channel, preventing users from sending messages',
    aliases: ['lockdown'],
    permissions: [PermissionsBitField.Flags.Administrator],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && message.author.id !== message.guild.ownerId) {
            return message.reply('You need Administrator permissions to use this command!');
        }

        const channel = message.channel;
        
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('I need the "Manage Channels" permission to lock channels!');
        }

        try {
            const everyoneRole = message.guild.roles.everyone;
            const currentPermissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
            
            if (currentPermissions && currentPermissions.deny.has(PermissionsBitField.Flags.SendMessages)) {
                return message.reply('This channel is already locked!');
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            });

            message.reply(`locked`);
            
            const { logModerationAction } = require('../index.js');
            await logModerationAction(message.guild, 'Channel Locked', message.author, channel.name, 'No reason provided');
        } catch (error) {
            console.error('Error locking channel:', error);
            message.reply('An error occurred while trying to lock the channel!');
        }
    }
};