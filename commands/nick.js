const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'nick',
    description: 'Set your own nickname',
    aliases: ['n'],
    async execute(message, args) {
        if (!args[0]) {
            return message.reply('Please provide a nickname!');
        }

        const nickname = args.join(' ');

        if (nickname.length > 32) {
            return message.reply('Nickname must be 32 characters or less!');
        }

        try {
            await message.member.setNickname(nickname);
            message.reply('I\'ve changed your nickname');
            
            const { logModerationAction } = require('../index.js');
            await logModerationAction(message.guild, 'Self Nickname Changed', message.author, message.author, `Changed to: ${nickname}`);
        } catch (error) {
            if (error.code === 50013) {
                message.reply('you\'re a higher role than me i cannot edit your nickname');
            } else {
                console.error('Error setting nickname:', error);
                message.reply('There was an error setting your nickname!');
            }
        }
    }
};
