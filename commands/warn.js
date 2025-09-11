const { PermissionFlagsBits } = require('discord.js');
const database = require('../database');

module.exports = {
    name: 'warn',
    description: 'Warn a user in the server',
    aliases: ['warning'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You don\'t have permission to warn members!');
        }

        if (!args[0]) {
            return message.reply('Who did you want me to warn?');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        if (user.id === message.author.id) {
            return message.reply('You cannot warn yourself!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot warn myself!');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('That user is not in this server!');
        }

        try {
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return message.reply('You cannot warn someone with equal or higher role!');
            }
        } catch (error) {
            console.log('Could not check role hierarchy, proceeding with warn attempt');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            await database.addWarning(message.guild.id, user.id, reason, message.author.tag, message.author.id);
        } catch (error) {
            console.error('Error adding warning:', error);
            return message.reply('There was an error saving the warning!');
        }

        try {
            await user.send(`You have been warned in ${message.guild.name} by ${message.author.tag}. Reason: ${reason}`);
        } catch (error) {
            console.log('Failed to send DM to user');
        }

        const warnCount = await database.getWarningCount(message.guild.id, user.id);
        message.reply(`Successfully warned ${user.tag}. They now have ${warnCount} warning(s).`);
    }
};
