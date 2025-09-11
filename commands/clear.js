const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'purge',
    description: 'Clear messages from the channel',
    aliases: ['clear', 'delete'],
    permissions: [PermissionFlagsBits.ManageMessages],
    execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('You don\'t have permission to manage messages!');
        }

        const amount = parseInt(args[0]);
        
        if (!amount || isNaN(amount)) {
            return message.reply('Please provide a valid number of messages to delete! Usage: `,clear <number>`');
        }

        if (amount < 1 || amount > 100) {
            return message.reply('Please provide a number between 1 and 100!');
        }

        message.channel.bulkDelete(amount, true)
            .then(messages => {
                message.channel.send(`Successfully deleted ${messages.size} messages!`)
                    .then(msg => {
                        setTimeout(() => msg.delete(), 3000);
                    });
            })
            .catch(error => {
                console.error('Error clearing messages:', error);
                message.reply('There was an error clearing messages!');
            });
    }
};
