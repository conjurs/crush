const database = require('../database');

module.exports = {
    name: 'clearsnipe',
    description: 'Clear all deleted messages for this channel',
    aliases: ['cs'],
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('You need the Manage Messages permission to use this command.');
        }
        
        const deletedMessage = await database.getLatestDeletedMessage(message.guild.id, message.channel.id);
        
        if (!deletedMessage) {
            return message.reply('No deleted messages found in this channel.');
        }
        
        await database.clearDeletedMessages(message.guild.id, message.channel.id);
        return message.reply('Cleared snipe messages!');
    }
};
