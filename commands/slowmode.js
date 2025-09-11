const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'slowmode',
    description: 'Set slowmode for the current channel',
    aliases: ['sm'],
    permissions: [PermissionFlagsBits.ManageChannels],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('You don\'t have permission to manage channels!');
        }

        if (!args[0]) {
            return message.reply('Please specify a time or "off" to disable slowmode!');
        }

        if (args[0].toLowerCase() === 'off') {
            try {
                await message.channel.setRateLimitPerUser(0);
                return message.reply('Slowmode has been disabled!');
            } catch (error) {
                console.error('Error disabling slowmode:', error);
                return message.reply('There was an error disabling slowmode!');
            }
        }

        const timeString = args[0].toLowerCase();
        let seconds = 0;

        if (timeString === '5s') {
            seconds = 5;
        } else if (timeString === '10s') {
            seconds = 10;
        } else if (timeString === '15s') {
            seconds = 15;
        } else if (timeString === '30s') {
            seconds = 30;
        } else if (timeString === '1min') {
            seconds = 60;
        } else if (timeString === '2min') {
            seconds = 120;
        } else if (timeString === '5min') {
            seconds = 300;
        } else if (timeString === '10min') {
            seconds = 600;
        } else if (timeString === '15min') {
            seconds = 900;
        } else if (timeString === '30min') {
            seconds = 1800;
        } else if (timeString === '1h') {
            seconds = 3600;
        } else if (timeString === '2h') {
            seconds = 7200;
        } else if (timeString === '6h') {
            seconds = 21600;
        } else {
            const timeMatch = timeString.match(/^(\d+)([smhd])$/);
            if (timeMatch) {
                const value = parseInt(timeMatch[1]);
                const unit = timeMatch[2];
                
                switch (unit) {
                    case 's':
                        seconds = value;
                        break;
                    case 'm':
                        seconds = value * 60;
                        break;
                    case 'h':
                        seconds = value * 3600;
                        break;
                    case 'd':
                        seconds = value * 86400;
                        break;
                }
            } else {
                return message.reply('Invalid time format! Use: 5s, 10s, 15s, 30s, 1min, 2min, 5min, 10min, 15min, 30min, 1h, 2h, 6h, or custom like 3h, 30m, etc.');
            }
        }

        if (seconds < 0 || seconds > 21600) {
            return message.reply('Slowmode must be between 0 and 6 hours!');
        }

        try {
            await message.channel.setRateLimitPerUser(seconds);
            const timeDisplay = seconds === 0 ? 'disabled' : 
                seconds < 60 ? `${seconds}s` :
                seconds < 3600 ? `${Math.floor(seconds / 60)}min` :
                `${Math.floor(seconds / 3600)}h`;
            
            message.reply(`Slowmode set to ${timeDisplay}!`);
        } catch (error) {
            console.error('Error setting slowmode:', error);
            message.reply('There was an error setting slowmode!');
        }
    }
};
