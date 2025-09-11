const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'softban',
    description: 'Softban a user (ban then unban to delete messages)',
    aliases: ['sban'],
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('You don\'t have permission to ban members!');
        }

        if (!args[0]) {
            return message.reply('Who do you want me to softban?');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        if (user.id === message.author.id) {
            return message.reply('You cannot softban yourself!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot softban myself!');
        }

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            try {
                if (member.roles.highest.position >= message.member.roles.highest.position) {
                    return message.reply('You cannot softban someone with equal or higher role!');
                }
            } catch (error) {
                console.log('Could not check role role hierachry');
            }
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await user.send(`You have been softbanned from ${message.guild.name} by ${message.author.tag}. Reason: ${reason}`);
        } catch (error) {
            console.log('Could not dm user:', error.message);
        }

        try {
            await message.guild.members.ban(user, { reason: `Softban: ${reason}`, deleteMessageDays: 7 });
            await message.guild.members.unban(user, `Softban: ${reason}`);
            
            message.reply(`${user.tag}(${user.id}) has been softbanned!`);
            
            const { logModerationAction } = require('../index.js');
            await logModerationAction(message.guild, 'User Softbanned', message.author, user, reason);
        } catch (error) {
            console.error('Error softbanning user:', error);
            message.reply('There was an error softbanning that user');
        }
    }
};
