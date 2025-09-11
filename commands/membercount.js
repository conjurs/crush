module.exports = {
    name: 'membercount',
    description: 'Show server member count',
    aliases: ['mc'],
    async execute(message, args) {
        const memberCount = message.guild.memberCount;
        message.reply(`${memberCount} members`);
    }
};
