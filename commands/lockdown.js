const { PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'lockdown',
    description: 'Locks or unlocks all channels in the server. use cmd to see more info',
    aliases: ['serverlock'],
    permissions: [PermissionsBitField.Flags.Administrator],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && message.author.id !== message.guild.ownerId) {
            return message.reply('You need Administrator permissions to use this command!');
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('I need the "Manage Channels" permission to lockdown the server!');
        }

        const action = args[0]?.toLowerCase();
        if (!action || (action !== 'on' && action !== 'off')) {
            return message.reply('Please specify "on" to lock or "off" to unlock!');
        }

        try {
            const everyoneRole = message.guild.roles.everyone;
            const channels = message.guild.channels.cache;
            let processedChannels = 0;
            let errors = 0;

            const startMessage = await message.reply(action === 'on' ? 'Starting lockdown...' : 'Starting unlock...');

            for (const [channelId, channel] of channels) {
                try {
                    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews) {
                        const currentPermissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
                        
                        if (action === 'on') {
                            if (!currentPermissions || !currentPermissions.deny.has(PermissionsBitField.Flags.SendMessages)) {
                                await channel.permissionOverwrites.edit(everyoneRole, {
                                    SendMessages: false,
                                    AddReactions: false
                                });
                                processedChannels++;
                            }
                        } else {
                            if (currentPermissions && currentPermissions.deny.has(PermissionsBitField.Flags.SendMessages)) {
                                await channel.permissionOverwrites.edit(everyoneRole, {
                                    SendMessages: null,
                                    AddReactions: null
                                });
                                processedChannels++;
                            }
                        }
                    } else if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                        const currentPermissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
                        
                        if (action === 'on') {
                            if (!currentPermissions || !currentPermissions.deny.has(PermissionsBitField.Flags.Connect)) {
                                await channel.permissionOverwrites.edit(everyoneRole, {
                                    Connect: false,
                                    Speak: false
                                });
                                processedChannels++;
                            }
                        } else {
                            if (currentPermissions && currentPermissions.deny.has(PermissionsBitField.Flags.Connect)) {
                                await channel.permissionOverwrites.edit(everyoneRole, {
                                    Connect: null,
                                    Speak: null
                                });
                                processedChannels++;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error ${action === 'on' ? 'locking' : 'unlocking'} channel ${channel.name}:`, error);
                    errors++;
                }
            }

            let finishMessage;
            const actionText = action === 'on' ? 'Lockdown' : 'Unlock';
            const processedText = action === 'on' ? 'Locked' : 'Unlocked';
            
            if (errors > 0) {
                finishMessage = await message.channel.send(`${actionText} done. ${processedText} ${processedChannels} channels with ${errors} errors.`);
            } else {
                finishMessage = await message.channel.send(`${actionText} done. ${processedText} ${processedChannels} channels.`);
            }
            
            const { logModerationAction } = require('../index.js');
            const actionName = action === 'on' ? 'Server Lockdown' : 'Server Unlock';
            await logModerationAction(message.guild, actionName, message.author, `${processedChannels} channels`, 'No reason provided');

            setTimeout(async () => {
                try {
                    await startMessage.delete();
                } catch (error) {
                    console.error('Error deleting message:', error);
                }
            }, 1000);
        } catch (error) {
            console.error(`Error during server ${action}:`, error);
            message.reply(`An error occurred while trying to ${action === 'on' ? 'lockdown' : 'unlock'} the server!`);
        }
    }
};