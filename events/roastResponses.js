const { Events } = require('discord.js');

module.exports = {
    messageCreate: {
        name: Events.MessageCreate,
        async execute(message) {
            if (message.author.bot) return;
            
            const content = message.content.toLowerCase();
            
            if (content.includes(' bank ') || content === 'bank') {
                await message.reply('bank is the richest pedophile');
            } else if (content.includes(' koi ') || content === 'koi') {
                await message.reply('koi is a nigger slave to the cautious.lol community');
            }
        }
    }
};
