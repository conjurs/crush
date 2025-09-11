const { PermissionFlagsBits } = require('discord.js');
const database = require('../database');

module.exports = {
    name: 'tempban',
    description: 'Temporarily ban a user from the server',
    aliases: ['tban'],
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('You don\'t have permission to ban members!');
        }

        if (!args[0]) {
            return message.reply('Who do you want me to tempban?');
        }

        if (!args[1]) {
            return message.reply('Please provide a duration! (e.g., 1d, 7d, 1h, 30m)');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        if (user.id === message.author.id) {
            return message.reply('You cannot tempban yourself!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot tempban myself!');
        }

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            try {
                if (member.roles.highest.position >= message.member.roles.highest.position) {
                    return message.reply('You cannot tempban someone with equal or higher role!');
                }
            } catch (error) {
                console.log('Could not check role hierarchy, proceeding with tempban attempt');
            }
        }

        const duration = args[1].toLowerCase();
        let durationMs = 0;

        const timeMatch = duration.match(/^(\d+)([smhd])$/);
        if (timeMatch) {
            const value = parseInt(timeMatch[1]);
            const unit = timeMatch[2];
            
            switch (unit) {
                case 's':
                    durationMs = value * 1000;
                    break;
                case 'm':
                    durationMs = value * 60 * 1000;
                    break;
                case 'h':
                    durationMs = value * 60 * 60 * 1000;
                    break;
                case 'd':
                    durationMs = value * 24 * 60 * 60 * 1000;
                    break;
            }
        } else {
            return message.reply('Invalid duration format! Use: 1s, 1m, 1h, 1d (e.g., 7d, 2h, 30m)');
        }

        if (durationMs < 60000 || durationMs > 31536000000) {
            return message.reply('Duration must be between 1 minute and 1 year!');
        }

        const reason = args.slice(2).join(' ') || 'No reason provided';
        const unbanTime = Date.now() + durationMs;

        try {
            await user.send(`You have been temporarily banned from ${message.guild.name} for ${duration} by ${message.author.tag}. Reason: ${reason}`);
        } catch (error) {
            console.log('Could not dm user:', error.message);
        }

        message.guild.members.ban(user, { reason: `Tempban: ${reason}` })
            .then(async () => {
                await database.setTempban(message.guild.id, user.id, unbanTime, reason, message.author.id);

                const durationText = durationMs < 60000 ? `${Math.floor(durationMs / 1000)}s` :
                    durationMs < 3600000 ? `${Math.floor(durationMs / 60000)}m` :
                    durationMs < 86400000 ? `${Math.floor(durationMs / 3600000)}h` :
                    `${Math.floor(durationMs / 86400000)}d`;

                message.reply(`${user.tag}(${user.id}) has been tempbanned for ${durationText}!`);
                
                const { logModerationAction } = require('../index.js');
                await logModerationAction(message.guild, 'User Tempbanned', message.author, user, reason);
            })
            .catch(error => {
                console.error('Error tempbanning user:', error);
                message.reply('There was an error tempbanning that user');
            });
    }
};
