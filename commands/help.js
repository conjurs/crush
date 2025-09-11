const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Show all available commands',
    aliases: ['commands', 'h'],
    execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('Bot Commands')
            .setDescription('Here are all the available commands:')
            .setColor('#0099ff')
            .setTimestamp();

        const commands = message.client.commands;
        
        const categories = {
            'General': ['ping', 'help', 'av', 'nick', 'forcenick', 'snipe', 'clearsnipe', 'afk', 'membercount', 'steal'],
            'Moderation': ['ban', 'unban', 'banlist', 'kick', 'clear', 'modlogs', 'mute', 'unmute', 'warn', 'warnlist', 'clearwarn', 'role', 'lock', 'unlock', 'lockdown', 'slowmode', 'nuke', 'sticky', 'tempban', 'softban', 'tempbanlist', 'roleinfo'],
            'Giveaway': ['giveaway', 'reroll'],
            'Music': ['music'],
            'Server Setup': ['welcome', 'autorole'],
        };

        for (const [category, commandNames] of Object.entries(categories)) {
            const categoryCommands = commandNames
                .filter(cmd => commands.has(cmd))
                .map(cmd => {
                    const command = commands.get(cmd);
                    return `\`${command.name}\` - ${command.description || 'No description'}`;
                });

            if (categoryCommands.length > 0) {
                embed.addFields({
                    name: category,
                    value: categoryCommands.join('\n'),
                    inline: false
                });
            }
        }

        embed.setFooter({ text: `Use ,<command> to use a command` });

        message.reply({ embeds: [embed] });
    }
};
