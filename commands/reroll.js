const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'reroll',
    description: 'Reroll a giveaway by ID',
    aliases: ['rr'],
    permissions: [PermissionFlagsBits.ManageMessages],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('You don\'t have permission to reroll giveaways!');
        }

        if (!args[0]) {
            return message.reply('Please provide a giveaway ID! Usage: `,reroll <id>`');
        }

        const giveawayId = parseInt(args[0]);
        if (isNaN(giveawayId)) {
            return message.reply('Please provide a valid giveaway ID!');
        }

        try {
            const messages = await message.channel.messages.fetch({ limit: 100 });
            let giveawayMessage = null;

            for (const [msgId, msg] of messages) {
                if (msg.embeds.length > 0) {
                    const embed = msg.embeds[0];
                    if (embed.footer && embed.footer.text && embed.footer.text.includes(`ID: ${giveawayId}`)) {
                        giveawayMessage = msg;
                        break;
                    }
                }
            }

            if (!giveawayMessage) {
                return message.reply(`Could not find a giveaway with ID ${giveawayId} in the last 100 messages!`);
            }

            const reaction = giveawayMessage.reactions.cache.get('🎉');
            if (!reaction) {
                return message.reply('This giveaway has no reactions!');
            }

            const users = await reaction.users.fetch();
            const participants = users.filter(user => !user.bot);

            const embed = giveawayMessage.embeds[0];
            let winnerCount = 1;

            const winnersField = embed.fields.find(field => field.name === 'Winners');
            if (winnersField) {
                const fieldValue = winnersField.value;
                
                if (fieldValue.includes(',')) {
                    const winnerNames = fieldValue.split(',').map(name => name.trim());
                    winnerCount = winnerNames.length;
                } else if (!isNaN(parseInt(fieldValue))) {
                    winnerCount = parseInt(fieldValue);
                }
            }

            if (participants.size === 0) {
                return message.reply('No one entered this giveaway!');
            }

            if (participants.size < winnerCount) {
                return message.reply(`Not enough participants! Only ${participants.size} people entered, but the giveaway was set for ${winnerCount} winner(s).`);
            }

            const newWinners = participants.random(winnerCount);

            const prize = embed.title || 'Unknown Prize';

            await message.channel.send(`Giveaway has ended!\n\`winner:\` ${newWinners.map(w => w.toString()).join(', ')} | \`prize:\` ${prize}`);

        } catch (error) {
            console.error('Error rerolling giveaway:', error);
            message.reply('There was an error rerolling the giveaway!');
        }
    }
};
