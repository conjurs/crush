const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Unban a user from the server',
    aliases: ['pardon'],
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('You don\'t have permission to unban members!');
        }

        if (!args[0]) {
            return message.reply('Who did you want me to unban?');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (!user) {
            try {
                const bans = await message.guild.bans.fetch();
                const searchTerm = args[0].toLowerCase();
                
                for (const [userId, banInfo] of bans) {
                    const bannedUser = banInfo.user;
                    if (bannedUser.tag.toLowerCase().includes(searchTerm) || 
                        bannedUser.username.toLowerCase().includes(searchTerm) ||
                        userId === args[0]) {
                        user = bannedUser;
                        break;
                    }
                }
            } catch (error) {
                console.error('Error fetching bans:', error);
            }
        }

        if (!user) {
            return message.reply('Could not find that user in the ban list!');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        message.guild.members.unban(user, { reason: reason })
            .then(async () => {
                message.reply(`${user.tag}(${user.id}) has been unbanned!`);
                
                const { logModerationAction } = require('../index.js');
                await logModerationAction(message.guild, 'User Unbanned', message.author, user, reason);
            })
            .catch(error => {
                console.error('Error unbanning user:', error);
                message.reply('There was an error unbanning that user!');
            });
    }
};
