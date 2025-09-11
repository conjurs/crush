const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'av',
    description: 'Get a user\'s profile picture',
    aliases: ['avatar', 'pfp'],
    permissions: [],
    async execute(message, args) {
        let user = message.mentions.users.first() || message.client.users.cache.get(args[0]) || message.author;
        
        if (user && user.id === message.client.user.id && message.mentions.users.size > 1) {
            user = message.mentions.users.filter(u => u.id !== message.client.user.id).first();
        }
        
        if (!user) {
            return message.reply('Could not find that user!');
        }

        const avatarURL = user.displayAvatarURL({ 
            dynamic: true, 
            size: 4096
        });

        const embed = new EmbedBuilder()
            .setTitle(`${user.tag}'s Avatar`)
            .setColor('#0099ff')
            .setImage(avatarURL)
            .setDescription(`[Download Avatar](${avatarURL})`)
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};