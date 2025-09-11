const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'autorole',
    description: 'Set up auto-role system for the server',
    aliases: ['autorolesetup'],
    permissions: [PermissionFlagsBits.ManageRoles],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('You don\'t have permission to manage roles!');
        }

        if (!args[0]) {
            return message.reply('Usage: `,autorole <role>`\nExample: `,autorole @Member`');
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        
        if (!role) {
            return message.reply('Please provide a valid role!');
        }

        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply('I cannot assign a role that is higher than or equal to my highest role!');
        }

        const database = require('../database');
        await database.setGuildSetting(message.guild.id, 'auto_role_id', role.id);

        message.reply(`Auto role system set up! New members will automatically receive the ${role} role.`);
    }
};
