const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Kick a user from the server',
    aliases: ['remove'],
    permissions: [PermissionFlagsBits.KickMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('You don\'t have permission to kick members!');
        }

        if (!args[0]) {
            return message.reply('Who did you want me to kick?');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('That user is not in this server!');
        }

        if (user.id === message.author.id) {
            return message.reply('You cannot kick yourself!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot kick myself!!!!');
        }

        try {
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return message.reply('You cannot kick someone with equal or higher role!');
            }
        } catch (error) {
            console.log('Could not check role hierarchy, proceeding with kick attempt');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await user.send(`You have been kicked from ${message.guild.name} by ${message.author.tag}. Reason: ${reason}`);
        } catch (error) {
            console.log('Could not DM user:', error.message);
        }

        member.kick(reason)
            .then(async () => {
                message.reply(`${user.tag}(${user.id}) has been kicked!`);
                
                const { logModerationAction } = require('../index.js');
                await logModerationAction(message.guild, 'User Kicked', message.author, user, reason);
            })
            .catch(error => {
                console.error('Error kicking user:', error);
                message.reply('There was an error kicking that user!');
            });
    }
};
