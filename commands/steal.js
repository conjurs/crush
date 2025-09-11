const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'steal',
    description: 'Steal an emoji from another server',
    permissions: [PermissionFlagsBits.ManageEmojisAndStickers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return message.reply('You don\'t have permission to manage emojis!');
        }

        if (!args[0]) {
            return message.reply('Please provide an emoji to steal!');
        }

        const emoji = args[0];
        const emojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
        
        if (!emojiMatch) {
            return message.reply('Please provide a valid emoji!');
        }

        const [, emojiName, emojiId] = emojiMatch;
        const isAnimated = emoji.startsWith('<a:');
        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;

        try {
            const createdEmoji = await message.guild.emojis.create({
                attachment: emojiUrl,
                name: emojiName
            });

            message.reply(`Stole emoji: ${createdEmoji}`);
        } catch (error) {
            console.error('Error stealing emoji:', error);
            message.reply('There was an error stealing that emoji!');
        }
    }
};
