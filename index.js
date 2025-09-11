const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const database = require('./database');
const eventHandlers = require('./events');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
const prefix = ',';

module.exports.logModerationAction = async function logModerationAction(guild, action, moderator, target, reason = 'No reason provided') {
    const logChannelId = await database.getGuildSetting(guild.id, 'mod_log_channel_id');
    if (!logChannelId) return;
    
    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;
    
    const moderatorId = moderator.id || moderator;
    const targetId = target.id || target;
    
    const embed = {
        color: 0x2f3136,
        title: action,
        fields: [
            {
                name: 'Moderator:',
                value: `<@${moderatorId}>`,
                inline: true
            },
            {
                name: 'Target:',
                value: `<@${targetId}>`,
                inline: true
            },
            {
                name: 'Reason:',
                value: reason,
                inline: false
            }
        ],
        timestamp: new Date().toISOString()
    };
    
    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to log moderation action:', error);
    }
}

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            console.log(`Loaded command: ${command.name}`);
        } else {
            console.log(`Command at ${filePath} is missing required "name" or "execute" property.`);
        }
    }
}

client.once(Events.ClientReady, async readyClient => {
    console.log(`Bot is ready! Logged in as ${readyClient.user.tag}`);
    readyClient.user.setActivity('cautious.lol casino', { type: 'PLAYING' });
    
    try {
        await database.init();
        console.log('Database initialized successfully');
        
        client.stickyMessages = new Map();
        const stickyMessages = await database.getAllStickyMessages();
        for (const sticky of stickyMessages) {
            try {
                const stickyData = {
                    enabled: Boolean(sticky.enabled),
                    message: sticky.message,
                    lastMessageId: sticky.last_message_id,
                    lastStickyTime: sticky.last_sticky_time
                };
                client.stickyMessages.set(sticky.channel_id, stickyData);
            } catch (error) {
                console.log(`Error loading sticky data for channel ${sticky.channel_id}:`, error);
            }
        }
        console.log(`Loaded ${client.stickyMessages.size} sticky message configurations`);
        
        setInterval(async () => {
            try {
                const tempbans = await database.getAllTempbans();
                const currentTime = Date.now();
                
                for (const tempban of tempbans) {
                    if (currentTime >= tempban.unban_time) {
                        const guild = client.guilds.cache.get(tempban.guild_id);
                        if (guild) {
                            try {
                                await guild.members.unban(tempban.user_id, 'Tempban expired');
                                console.log(`Unbanned user ${tempban.user_id} from guild ${guild.id}`);
                            } catch (error) {
                                console.log(`Could not unban user ${tempban.user_id}:`, error.message);
                            }
                        }
                        
                        await database.removeTempban(tempban.guild_id, tempban.user_id);
                    }
                }
            } catch (error) {
                console.log('Error checking tempbans:', error);
            }
        }, 60000);
        console.log('Tempban checker started');
        
        for (const [eventName, eventHandler] of Object.entries(eventHandlers)) {
            if (eventHandler.once) {
                client.once(eventName, (...args) => eventHandler.execute(...args));
            } else {
                client.on(eventName, (...args) => eventHandler.execute(...args));
            }
        }
        console.log('Event handlers loaded successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
});

client.on(Events.GuildMemberAdd, async member => {
    const autoRoleId = await database.getGuildSetting(member.guild.id, 'auto_role_id');
    
    const { replaceVariables } = require('./commands/welcome.js');
    const guildWelcomeMessages = await database.getWelcomeMessages(member.guild.id);
    
    if (guildWelcomeMessages && guildWelcomeMessages.length > 0) {
        for (const welcomeData of guildWelcomeMessages) {
            const channel = member.guild.channels.cache.get(welcomeData.channel_id);
            if (channel) {
                const processedMessage = replaceVariables(welcomeData.message, member);
                await channel.send(processedMessage);
            }
        }
    }
    
    if (autoRoleId) {
        const autoRole = member.guild.roles.cache.get(autoRoleId);
        if (autoRole) {
            try {
                await member.roles.add(autoRole);
                console.log(`Auto-assigned role ${autoRole.name} to ${member.user.tag}`);
            } catch (error) {
                console.error(`Failed to assign auto-role: ${error}`);
            }
        }
    }
});


client.on(Events.MessageCreate, async message => {
    if (message.author.bot || message.author.id === client.user.id) return;
    
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName) || 
                       client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(`Error executing ${commandName}:`, error);
            message.reply('There was an error while executing this command!');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);