const { PermissionFlagsBits } = require('discord.js');
const database = require('../database');

function replaceVariables(message, member) {
    return message
        .replace(/{user}/g, member.user.toString())
        .replace(/{username}/g, member.user.username)
        .replace(/{usertag}/g, member.user.tag)
        .replace(/{userid}/g, member.user.id)
        .replace(/{server}/g, member.guild.name)
        .replace(/{serverid}/g, member.guild.id)
        .replace(/{membercount}/g, member.guild.memberCount)
        .replace(/{channel}/g, member.guild.channels.cache.find(c => c.name.includes('welcome') || c.name.includes('general'))?.toString() || 'this server');
}

module.exports = {
    name: 'welcome',
    description: 'Manage welcome messages for the server',
    aliases: ['welcomesetup'],
    permissions: [PermissionFlagsBits.ManageGuild],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('You don\'t have permission to manage server settings!');
        }

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand || subcommand === 'help') {
            return message.reply(`Welcome System Commands:
,welcome list - View all welcome messages
,welcome add <channel> <message> - Add a welcome message for a channel
,welcome remove <channel> - Remove a welcome message from a channel
,welcome variables - View all available variables for welcome messages
,welcome view <channel> - View welcome message for a channel`);
        }

        if (subcommand === 'list') {
            const guildWelcomeMessages = await database.getWelcomeMessages(message.guild.id);
            
            if (!guildWelcomeMessages || guildWelcomeMessages.length === 0) {
                return message.reply('No welcome messages set up for this server.');
            }

            let listText = 'Welcome Messages:\n';
            for (const welcomeData of guildWelcomeMessages) {
                const channel = message.guild.channels.cache.get(welcomeData.channel_id);
                if (channel) {
                    listText += `${channel.name}: ${welcomeData.message}\n`;
                }
            }

            return message.reply(listText);
        }

        if (subcommand === 'add') {
            if (args.length < 3) {
                return message.reply('Usage: `,welcome add <channel> <message>`\nExample: `,welcome add #welcome Welcome {user} to {server}!`');
            }

            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            
            if (!channel) {
                return message.reply('Please provide a valid channel!');
            }

            const welcomeMessage = args.slice(2).join(' ');

            try {
                await database.addWelcomeMessage(message.guild.id, channel.id, welcomeMessage);
                message.reply(`Welcome message added for ${channel}!\nMessage: ${welcomeMessage}`);
            } catch (error) {
                console.error('Error adding welcome message:', error);
                message.reply('There was an error adding the welcome message!');
            }
        }

        if (subcommand === 'remove') {
            if (!args[1]) {
                return message.reply('Usage: `,welcome remove <channel>`\nExample: `,welcome remove #welcome`');
            }

            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            
            if (!channel) {
                return message.reply('Please provide a valid channel!');
            }

            try {
                await database.removeWelcomeMessage(message.guild.id, channel.id);
                message.reply(`Welcome message removed from ${channel}.`);
            } catch (error) {
                console.error('Error removing welcome message:', error);
                message.reply('There was an error removing the welcome message!');
            }
        }

        if (subcommand === 'variables') {
            return message.reply(`Welcome Message Variables:
{user} - User mention
{username} - Username only
{usertag} - Username
{userid} - User ID
{server} - Server name
{serverid} - Server ID
{membercount} - Total member count
{channel} - Welcome channel mention`);
        }

        if (subcommand === 'view') {
            if (!args[1]) {
                return message.reply('Usage: `,welcome view <channel>`\nExample: `,welcome view #welcome`');
            }

            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            
            if (!channel) {
                return message.reply('Please provide a valid channel!');
            }

            const guildWelcomeMessages = await database.getWelcomeMessages(message.guild.id);
            const welcomeData = guildWelcomeMessages.find(w => w.channel_id === channel.id);
            
            if (!welcomeData) {
                return message.reply(`No welcome message found for ${channel}.`);
            }

            return message.reply(`Welcome message for ${channel.name}:\n${welcomeData.message}`);
        }

        message.reply('Invalid subcommand! Use `,welcome help` to see available commands.');
    }
};

module.exports.replaceVariables = replaceVariables;
