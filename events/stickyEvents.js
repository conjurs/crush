const { Events } = require('discord.js');
const database = require('../database');

module.exports = {
    messageCreate: {
        name: Events.MessageCreate,
        async execute(message) {
            if (message.author.bot) return;
            
            if (message.content && message.content.startsWith('**STICKIED MESSAGE**')) return;

            if (message.content && message.content.startsWith(',afk')) return;

            const afkData = await database.getAfkUser(message.guild.id, message.author.id);
            if (afkData) {
                try {
                    await database.removeAfkUser(message.guild.id, message.author.id);
                    message.reply('Your AFK is stopped');
                } catch (error) {
                    console.log('Error processing AFK removal:', error);
                }
            }

            if (message.mentions.users.size > 0) {
                for (const [, user] of message.mentions.users) {
                    if (user.bot) continue;
                    
                    const userAfkData = await database.getAfkUser(message.guild.id, user.id);
                    
                    if (userAfkData) {
                        try {
                            const afkTime = new Date(userAfkData.timestamp);
                            const discordTimestamp = `<t:${Math.floor(afkTime.getTime() / 1000)}:R>`;
                            
                            if (userAfkData.message === 'AFK') {
                                message.reply(`${user.username} is AFK ${discordTimestamp}`);
                            } else {
                                message.reply(`${user.username} is AFK: ${userAfkData.message} ${discordTimestamp}`);
                            }
                        } catch (error) {
                            console.log('Error processing AFK mention:', error);
                        }
                    }
                }
            }

            if (message.client.stickyMessages && message.client.stickyMessages.has(message.channel.id)) {
                const stickyData = message.client.stickyMessages.get(message.channel.id);
                
                if (stickyData.enabled && stickyData.message) {
                    const now = Date.now();
                    const lastStickyTime = stickyData.lastStickyTime || 0;
                    const cooldown = 5000;

                    if (now - lastStickyTime < cooldown) {
                        return;
                    }

                    stickyData.lastStickyTime = now;

                    if (stickyData.lastMessageId && stickyData.lastMessageId !== 'null') {
                        try {
                            const lastMessage = await message.channel.messages.fetch(stickyData.lastMessageId);
                            await lastMessage.delete();
                        } catch (error) {
                            console.log('Could not delete last sticky message:', error.message);
                            stickyData.lastMessageId = null;
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, 200));

                    try {
                        const stickyMessage = await message.channel.send(`**STICKIED MESSAGE**\n\n${stickyData.message}`);
                        stickyData.lastMessageId = stickyMessage.id;
                        stickyData.lastStickyTime = Date.now();
                        
                        await database.setStickyMessage(message.guild.id, message.channel.id, stickyData.message, true, stickyData.lastMessageId, stickyData.lastStickyTime);
                    } catch (error) {
                        console.log('Could not send sticky message');
                    }
                }
            }
        }
    }
};
