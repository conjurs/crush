const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'reload',
    description: 'Reload all bot commands',
    aliases: ['restart', 'refresh'],
    ownerOnly: true,
    execute(message, args) {
        const ownerId = process.env.OWNER_ID || 'your_user_id_here';
        if (message.author.id !== ownerId) {
            return message.reply('You are not authorized to use this command!');
        }

        const commandsPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            if (file === 'reload.js') continue;
            
            try {
                delete require.cache[require.resolve(path.join(commandsPath, file))];
                const command = require(path.join(commandsPath, file));
                
                if ('name' in command && 'execute' in command) {
                    message.client.commands.set(command.name, command);
                }
            } catch (error) {
                console.error(`Error reloading ${file}:`, error);
            }
        }

        message.reply('reloaded!');
    }
};

