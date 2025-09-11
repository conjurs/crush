const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Unlocks the current channel, allowing users to send messages again',
    aliases: ['unlockdown'],
    permissions: [PermissionsBitField.Flags.Administrator],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && message.author.id !== message.guild.ownerId) {
            return message.reply('You need Administrator permissions to use this command!');
        }

        const channel = message.channel;
        
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('I need the "Manage Channels" permission to unlock channels!');
        }

        try {
            const everyoneRole = message.guild.roles.everyone;
            const currentPermissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
            
            if (!currentPermissions || !currentPermissions.deny.has(PermissionsBitField.Flags.SendMessages)) {
                return message.reply('This channel is not locked!');
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null
            });

            message.reply(`unlocked`);
            
            const { logModerationAction } = require('../index.js');
            await logModerationAction(message.guild, 'Channel Unlocked', message.author, channel.name, 'No reason provided');
        } catch (error) {
            console.error('Error unlocking channel:', error);
            message.reply('An error occurred while trying to unlock the channel!');
        }
    }
};