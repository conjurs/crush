module.exports = {
    name: 'rape',
    description: 'Rape a user',
    execute(message, args) {
        if (!args.length) {
            return message.reply('You need to mention a user to rape!');
        }
        
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('You need to mention a valid user!');
        }
        
        message.delete().catch(console.error);
        message.channel.send(`${message.author} violently rapes ${user}`);
    }
};
