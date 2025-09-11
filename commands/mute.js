const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Mute a user in the server',
    aliases: ['timeout'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You don\'t have permission to mute members!');
        }

        if (!args[0]) {
            return message.reply('Who do you want me to mute?');
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
            return message.reply('You cannot mute yourself!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot mute myself');
        }

        try {
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return message.reply('You cannot mute someone with equal or higher role');
            }
        } catch (error) {
            console.error('Error checking role hierarchy:', error);
            return message.reply('An error occurred while checking role permissions');
        }

        const timeArg = args[1];
        const duration = timeArg ? ms(timeArg) : 10 * 60 * 1000;

        if (!duration || isNaN(duration)) {
            return message.reply('Please provide a valid duration for the mute');
        }

        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            await user.send(`You have been muted in ${message.guild.name} by ${message.author.tag}. Reason: ${reason}`);
        } catch (error) {
            console.log('Failed to send DM to user');
        }

        try {
            await member.timeout(duration, reason);
            
            const { logModerationAction } = require('../index.js');
            await logModerationAction(message.guild, 'User Muted', message.author, user, reason);
            
            return message.reply(`${user.tag} (${user.id}) has been muted for ${ms(duration, { long: true })}!`);
        } catch (error) {
            console.error('Error muting user:', error);
            return message.reply('There was an error muting that user');
        }
    }
};
