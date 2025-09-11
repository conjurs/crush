const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../database');

module.exports = {
    name: 'giveaway',
    description: 'Manage giveaways',
    aliases: ['gw'],
    permissions: [PermissionFlagsBits.ManageMessages],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('You don\'t have permission to manage giveaways!');
        }

        if (!args[0]) {
            return message.reply('Usage: `,giveaway start <duration> <winners> <prize>`\nExample: `,giveaway start 24h 2 custom badge`');
        }

        const subcommand = args[0].toLowerCase();

        if (subcommand === 'start') {
            if (args.length < 4) {
                return message.reply('Usage: `,giveaway start <duration> <winners> <prize>`\nExample: `,giveaway start 24h 2 custom badge`');
            }

            const duration = args[1];
            const winners = parseInt(args[2]);
            const prize = args.slice(3).join(' ');

            if (isNaN(winners) || winners < 1) {
                return message.reply('Please provide a valid number of winners!');
            }

            const durationMs = parseDuration(duration);
            if (!durationMs) {
                return message.reply('Invalid duration! Use formats like: 30m, 1h, 24h, 7d');
            }

            const endTime = new Date(Date.now() + durationMs);
            const giveawayId = await database.getNextGiveawayId();

            const embed = new EmbedBuilder()
                .setTitle(prize)
                .setColor('#2f3136')
                .addFields(
                    { name: 'Ends:', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Hosted by:', value: `${message.author}`, inline: true },
                    { name: 'Winners:', value: winners.toString(), inline: true }
                )
                .setFooter({ text: `ID: ${giveawayId}` });

            const giveawayMessage = await message.channel.send({ embeds: [embed] });
            await giveawayMessage.react('🎉');

            setTimeout(async () => {
                try {
                    const updatedMessage = await message.channel.messages.fetch(giveawayMessage.id);
                    const reaction = updatedMessage.reactions.cache.get('🎉');
                    
                    if (!reaction) {
                        await message.channel.send('Giveaway ended but no one entered!');
                        return;
                    }

                    const users = await reaction.users.fetch();
                    const participants = users.filter(user => !user.bot);

                    if (participants.size === 0) {
                        await message.channel.send('Giveaway ended but no one entered!');
                        return;
                    }

                    const winnerCount = Math.min(winners, participants.size);
                    const winnersList = participants.random(winnerCount);

                    const endEmbed = new EmbedBuilder()
                        .setTitle(prize)
                        .setColor('#2f3136')
                        .addFields(
                            { name: 'Ended:', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true },
                            { name: 'Hosted by:', value: `${message.author}`, inline: true },
                            { name: 'Winners:', value: winnersList.map(w => w.toString()).join(', '), inline: true },
                            { name: 'Entries:', value: participants.size.toString(), inline: true }
                        )
                        .setFooter({ text: `ID: ${giveawayId}` })

                    await giveawayMessage.edit({ embeds: [endEmbed] });
                    await message.channel.send(`Giveaway has ended!\n\`winner:\` ${winnersList.map(w => w.toString()).join(', ')} | \`prize:\` ${prize}`);

                } catch (error) {
                    if (error.code === 10008) {
                        console.log('Giveaway message was deleted, ending giveaway silently');
                        return;
                    }
                    console.error('Error ending giveaway:', error);
                    await message.channel.send('There was an error ending the giveaway!');
                }
            }, durationMs);

            const startMessage = await message.reply(`Giveaway started! ID: ${giveawayId}`);
            setTimeout(() => {
                startMessage.delete().catch(console.error);
            }, 2000);
        } else {
            message.reply('Usage: `,giveaway start <duration> <winners> <prize>`\nExample: `,giveaway start 24h 2 custom badge`');
        }
    }
};


function parseDuration(duration) {
    const regex = /^(\d+)([smhd])$/i;
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}
