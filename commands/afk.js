const database = require('../database');

module.exports = {
    name: 'afk',
    description: 'Set your AFK status',
    async execute(message, args) {
        const afkMessage = args.join(' ') || 'AFK';

        try {
            await database.setAfkUser(message.guild.id, message.author.id, afkMessage, Date.now());
            
            if (afkMessage === 'AFK') {
                message.reply('You\'re now AFK');
            } else {
                message.reply(`You\'re now AFK with the status: ${afkMessage}`);
            }
        } catch (error) {
            console.error('Error setting AFK:', error);
            message.reply('There was an error setting your AFK status!');
        }
    }
};
