const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const database = require('../database');

module.exports = {
    name: 'warnlist',
    description: 'View warnings for a user',
    aliases: ['warnings', 'warnhistory'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You don\'t have permission to view warnings!');
        }

        if (!args[0]) {
            return message.reply('Whose warnings do you want to see? Usage: `,warnlist @user`');
        }

        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]);
        
        if (user && user.id === message.client.user.id) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first() || message.client.users.cache.get(args[0]);
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        const userWarnings = await database.getWarnings(message.guild.id, user.id);

        if (!userWarnings || userWarnings.length === 0) {
            return message.reply(`${user.tag} has no warnings in this server.`);
        }
        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${user.tag}`)
            .setColor('#ff9900')
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `Total warnings: ${userWarnings.length}` })
            .setTimestamp();

        const warningFields = userWarnings.slice(-10).map((warning, index) => {
            const date = new Date(warning.timestamp).toLocaleDateString();
            const time = new Date(warning.timestamp).toLocaleTimeString();
            return {
                name: `Warning #${userWarnings.length - 9 + index}`,
                value: `**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Date:** ${date} at ${time}`,
                inline: false
            };
        });

        if (userWarnings.length > 10) {
            embed.setDescription(`Showing the 10 most recent warnings. This user has ${userWarnings.length} total warnings.`);
        }

        embed.addFields(warningFields);

        message.reply({ embeds: [embed] });
    }
};