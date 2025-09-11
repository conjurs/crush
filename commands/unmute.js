const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Unmute a user in the server',
    aliases: ['untimeout'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You don\'t have permission to unmute members!');
        }

        if (!args[0]) {
            return message.reply('Who do you want me to unmute?');
        }
        
        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        if (!user) {
            return message.reply('Could not find that user');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('That user is not in this server');
        }

        if (user.id === message.author.id) {
            return message.reply('You cannot unmute yourself!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot unmute myself');
        }

        if (!member.isCommunicationDisabled()) {
            return message.reply('That user is not muted');
        }

        try {
            await user.send(`You have been unmuted in ${message.guild.name} by ${message.author.tag}`);
        } catch (error) {
            console.log('Failed to send DM to user');
        }

        try {
            await member.timeout(null, `Unmuted by ${message.author.tag}`);
            
            const { logModerationAction } = require('../index.js');
            await logModerationAction(message.guild, 'User Unmuted', message.author, user, 'No reason provided');
            
            message.reply(`Successfully unmuted ${user.tag}`);
        } catch (error) {
            console.log('Failed to unmute user');
            return message.reply('There was an error unmuting that user');
        }
    }
}