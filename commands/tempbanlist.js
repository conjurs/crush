const database = require('../database');

module.exports = {
    name: 'tempbanlist',
    description: 'List all current tempbans',
    aliases: ['tbanlist'],
    async execute(message, args) {
        try {
            const tempbans = [];
            const tempbanList = await database.getAllTempbans(message.guild.id);
            
            for (const tempban of tempbanList) {
                const currentTime = Date.now();
                const timeLeft = tempban.unban_time - currentTime;
                
                if (timeLeft > 0) {
                    const user = message.client.users.cache.get(tempban.user_id);
                    const username = user ? user.username : `Unknown`;
                    
                    const unbanTime = new Date(tempban.unban_time);
                    const discordTimestamp = `<t:${Math.floor(unbanTime.getTime() / 1000)}:R>`;
                    
                    tempbans.push(`${username}(${tempban.user_id}) ${discordTimestamp}`);
                }
            }
            
            if (tempbans.length === 0) {
                message.reply('No active tempbans');
            } else {
                message.reply(tempbans.join('\n'));
            }
        } catch (error) {
            console.error('Error getting tempban list:', error);
            message.reply('There was an error getting the tempban list');
        }
    }
};
