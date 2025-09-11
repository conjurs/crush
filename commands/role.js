const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'role',
    description: 'Give or remove roles from users',
    aliases: ['addrole', 'removerole'],
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator) && message.author.id !== message.guild.ownerId) {
            return message.reply('You need Administrator permissions or be the server owner to use this command!');
        }

        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('I need the "Manage Roles" permission to use this command!');
        }

        if (args.length < 2) {
            return message.reply('**Usage:** `,role <@user/userID> <@role/roleName>` (toggles role)\n**Or:** `,role <add/remove> <@user/userID> <@role/roleName>`\n\n**Examples:**\n`,role @user @Member`\n`,role add @user @Member`\n`,role remove @user Member`');
        }

        let action, userArg, roleArg;
        
        if (['add', 'remove'].includes(args[0].toLowerCase())) {
            if (args.length < 3) {
                return message.reply('**Usage:** `,role <add/remove> <@user/userID> <@role/roleName>`');
            }
            action = args[0].toLowerCase();
            userArg = args[1];
            roleArg = args.slice(2);
        } else {
            action = 'toggle';
            userArg = args[0];
            roleArg = args.slice(1);
        }

        let targetUser = message.mentions.users.first() || message.client.users.cache.get(userArg);
        if (!targetUser) {
            return message.reply('Could not find that user!');
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);
        if (!targetMember) {
            return message.reply('That user is not in this server!');
        }

        let targetRole = message.mentions.roles.first() || 
                        message.guild.roles.cache.find(role => role.name.toLowerCase() === roleArg.join(' ').toLowerCase()) ||
                        message.guild.roles.cache.get(roleArg[0]);
        
        if (!targetRole) {
            return message.reply('Could not find that role!');
        }

        if (targetRole.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply('You cannot manage a role that is equal to or higher than your highest role!');
        }

        if (targetRole.position >= message.guild.members.me.roles.highest.position) {
            return message.reply('I cannot manage a role that is equal to or higher than my highest role!');
        }

        if (targetRole.id === message.guild.id) {
            return message.reply('I cannot manage the @everyone role!');
        }

        if (targetUser.id === message.client.user.id) {
            return message.reply('I cannot modify my own roles!');
        }

        try {
            const { logModerationAction } = require('../index.js');
            
            if (action === 'add') {
                if (targetMember.roles.cache.has(targetRole.id)) {
                    return message.reply(`${targetUser.tag} already has the ${targetRole.name} role!`);
                }
                
                await targetMember.roles.add(targetRole);
                message.reply(`Successfully added **${targetRole.name}** to ${targetUser.tag}!`);
                
                await logModerationAction(message.guild, 'Role Added', message.author, targetUser, `Role: ${targetRole.name}`);
                
            } else if (action === 'remove') {
                if (!targetMember.roles.cache.has(targetRole.id)) {
                    return message.reply(`${targetUser.tag} doesn't have the ${targetRole.name} role!`);
                }
                
                await targetMember.roles.remove(targetRole);
                message.reply(`Successfully removed **${targetRole.name}** from ${targetUser.tag}!`);
                
                await logModerationAction(message.guild, 'Role Removed', message.author, targetUser, `Role: ${targetRole.name}`);
                
            } else if (action === 'toggle') {
                if (targetMember.roles.cache.has(targetRole.id)) {
                    await targetMember.roles.remove(targetRole);
                    message.reply(`Successfully removed **${targetRole.name}** from ${targetUser.tag}!`);
                    
                    await logModerationAction(message.guild, 'Role Removed', message.author, targetUser, `Role: ${targetRole.name}`);
                } else {
                    await targetMember.roles.add(targetRole);
                    message.reply(`Successfully added **${targetRole.name}** to ${targetUser.tag}!`);
                    
                    await logModerationAction(message.guild, 'Role Added', message.author, targetUser, `Role: ${targetRole.name}`);
                }
            }
            
        } catch (error) {
            console.error('Error managing role:', error);
            return message.reply('There was an error managing that role. Please check my permissions and role hierarchy.');
        }
    }
};