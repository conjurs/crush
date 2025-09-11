const database = require('../database');

module.exports = {
    name: 'snipe',
    description: 'Show the latest deleted message in this channel',
    aliases: ['s'],
    async execute(message, args) {
        const deletedMessage = await database.getLatestDeletedMessage(message.guild.id, message.channel.id);
        
        if (!deletedMessage) {
            return message.reply('No deleted messages found in this channel.');
        }
        
        let messageText = `**${deletedMessage.username}:** `;
        
        if (deletedMessage.content) {
            messageText += deletedMessage.content;
        }
        
        if (deletedMessage.attachments) {
            const attachmentUrls = deletedMessage.attachments.split(',');
            const attachmentText = attachmentUrls.map(url => `[Attachment](${url})`).join(' ');
            messageText += ` ${attachmentText}`;
        }
        
        if (!deletedMessage.content && !deletedMessage.attachments) {
            messageText += 'No content';
        }
        
        await message.reply(messageText);
    }
};
