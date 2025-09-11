const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'forcenick',
    description: 'Set someone else\'s nickname',
    aliases: ['fn'],
    permissions: [PermissionFlagsBits.ManageNicknames],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return message.reply('You don\'t have permission to manage nicknames!');
        }

        if (!args[0]) {
            return message.reply('Who did you want me to change the nickname of?');
        }

        if (!args[1]) {
            return message.reply('Please provide a nickname!');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('That user is not in this server!');
        }

        if (user.id === message.author.id) {
            return message.reply('Use the nick command to change your own nickname!');
        }

        if (user.id === message.client.user.id) {
            return message.reply('I cannot change my own nickname!');
        }

        try {
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return message.reply('You cannot change the nickname of someone with equal or higher role!');
            }
        } catch (error) {
            console.log('Could not check role hierarchy, proceeding with nickname change attempt');
        }

        const nickname = args.slice(1).join(' ');

        if (nickname.length > 32) {
            return message.reply('Nickname must be 32 characters or less!');
        }

        try {
            await member.setNickname(nickname);
            message.reply('I\'ve changed their nickname');
            
            const { logModerationAction } = require('../index.js');
            await logModerationAction(message.guild, 'Nickname Changed', message.author, user, `Changed to: ${nickname}`);
        } catch (error) {
            if (error.code === 50013) {
                message.reply('they\'re a higher role than me i cannot edit their nickname');
            } else {
                console.error('Error setting nickname:', error);
                message.reply('There was an error setting that user\'s nickname!');
            }
        }
    }
};
