module.exports = {
    name: 'roleinfo',
    description: 'Get information about a role',
    aliases: ['ri'],
    async execute(message, args) {
        if (!args[0]) {
            return message.reply('Please provide a role!');
        }

        let role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase()) || message.guild.roles.cache.get(args[0]);

        if (!role) {
            return message.reply('Could not find that role!');
        }

        const memberCount = role.members.size;
        const color = role.hexColor === '#000000' ? 'None' : role.hexColor;
        
        const permissions = role.permissions.toArray();
        const permList = permissions.length > 0 ? permissions.join(', ') : 'None';

        message.reply(`**${role.name}**\nID: ${role.id}\nMembers: ${memberCount}\nColor: ${color}\nPermissions: ${permList}`);
    }
};
