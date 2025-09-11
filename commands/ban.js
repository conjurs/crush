const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Ban a user from the server',
    aliases: ['banish'],
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('You don\'t have permission to ban members!');
        }

        if (!args[0]) {
            return message.reply('Who did you want me to ban?');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        if (user.id === message.author.id) {
            return message.reply('You cannot ban yourself!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot ban myself!');
        }

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            try {
                if (member.roles.highest.position >= message.member.roles.highest.position) {
                    return message.reply('You cannot ban someone with equal or higher role!');
                }
            } catch (error) {
                console.log('Could not check role hierarchy, proceeding with ban attempt');
            }
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await user.send(`You have been banned from ${message.guild.name} by ${message.author.tag}. Reason: ${reason}`);
        } catch (error) {
            console.log('Could not dm user:', error.message);
        }

        message.guild.members.ban(user, { reason: reason })
            .then(async () => {
                message.reply(`${user.tag}(${user.id}) has been banned!`);
                
                const { logModerationAction } = require('../index.js');
                await logModerationAction(message.guild, 'User Banned', message.author, user, reason);
            })
            .catch(error => {
                console.error('Error banning user:', error);
                message.reply('There was an error banning that user');
            });
    }
};
