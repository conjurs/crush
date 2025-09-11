const { PermissionFlagsBits } = require('discord.js');
const database = require('../database');

module.exports = {
    name: 'clearwarn',
    description: 'Clear all warnings for a user',
    aliases: ['clearwarnings', 'clearwarns', 'resetwarnings'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You don\'t have permission to clear warnings!');
        }

        if (!args[0]) {
            return message.reply('Whose warnings do you want to clear?');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot clear my own warnings!');
        }

        const warningCount = await database.getWarningCount(message.guild.id, user.id);

        if (warningCount === 0) {
            return message.reply(`${user.tag} has no warnings to clear in this server.`);
        }

        try {
            await database.clearWarnings(message.guild.id, user.id);
            message.reply(`Successfully cleared ${warningCount} warning(s) for ${user.tag}.`);
        } catch (error) {
            console.error('Error clearing warnings:', error);
            message.reply('There was an error clearing the warnings!');
        }
    }
};