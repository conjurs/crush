const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'banlist',
    description: 'Show list of banned users',
    aliases: ['bans', 'banned'],
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('You don\'t have permission to view banned members!');
        }

        try {
            const bans = await message.guild.bans.fetch();
            
            if (bans.size === 0) {
                return message.reply('No users are currently banned.');
            }

            let banList = '**Banned Users:**\n';
            let count = 0;
            
            for (const [userId, banInfo] of bans) {
                const user = banInfo.user;
                const reason = banInfo.reason || 'No reason provided';
                banList += `${count + 1}. **${user.tag}** (${user.id})\n   Reason: ${reason}\n\n`;
                count++;
                
                if (count >= 20) {
                    banList += `... and ${bans.size - 20} more banned users.`;
                    break;
                }
            }

            if (banList.length > 2000) {
                banList = banList.substring(0, 1950) + '... (truncated)';
            }

            message.reply(banList);
        } catch (error) {
            console.error('Error fetching ban list:', error);
            message.reply('There was an error fetching the ban list!');
        }
    }
};
