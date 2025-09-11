const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'nuke',
    description: 'Nuke a channel and recreate it with same permissions',
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You don\'t have permission to nuke channels!');
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('nuke_yes')
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('nuke_no')
                    .setLabel('No')
                    .setStyle(ButtonStyle.Secondary)
            );

        const response = await message.reply({
            content: 'Do I nuke this channel?',
            components: [row]
        });

        const filter = i => i.user.id === message.author.id;
        const collector = response.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async i => {
            if (i.customId === 'nuke_yes') {
                try {
                    const channel = message.channel;
                    const channelName = channel.name;
                    const channelPosition = channel.position;
                    const channelParent = channel.parent;
                    const channelPermissions = channel.permissionOverwrites.cache.map(overwrite => ({
                        id: overwrite.id,
                        type: overwrite.type,
                        allow: overwrite.allow.bitfield,
                        deny: overwrite.deny.bitfield
                    }));

                    await channel.delete();

                    const newChannel = await channelParent.children.create({
                        name: channelName,
                        type: channel.type,
                        position: channelPosition,
                        permissionOverwrites: channelPermissions
                    });

                    await newChannel.send('oops');
                } catch (error) {
                    console.error('Error nuking channel:', error);
                    try {
                        await i.update({ content: 'There was an error nuking the channel!', components: [] });
                    } catch (updateError) {
                        console.log('Could not update interaction (channel may have been deleted)');
                    }
                }
            } else if (i.customId === 'nuke_no') {
                await i.update({ content: 'Channel nuke cancelled.', components: [] });
            }
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                await response.edit({ content: 'Nuke request timed out.', components: [] });
            }
        });
    }
};
