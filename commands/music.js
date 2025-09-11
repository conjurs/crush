const { PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const playDl = require('play-dl');

const queue = new Map();

module.exports = {
    name: 'music',
    description: 'Music commands for playing songs from YouTube',
    aliases: ['play', 'stop', 'skip', 'queue'],
    permissions: [PermissionFlagsBits.Connect],
    async execute(message, args) {
        if (!message.member.voice.channel) {
            return message.reply('You need to be in a voice channel to use music commands!');
        }

        const subcommand = args[0]?.toLowerCase();

        if (subcommand === 'play' || !subcommand) {
            if (!args[1]) {
                return message.reply('Please provide a song name or YouTube URL! Usage: `,music play <song name>`');
            }

            const query = args.slice(1).join(' ');
            const voiceChannel = message.member.voice.channel;

            try {
                let videoInfo;
                
                if (query.includes('youtube.com') || query.includes('youtu.be')) {
                    videoInfo = await playDl.video_basic_info(query);
                } else {
                    const results = await playDl.search(query, { limit: 1 });
                    if (!results || results.length === 0) {
                        return message.reply('No results found for that search!');
                    }
                    videoInfo = await playDl.video_basic_info(results[0].url);
                }

                const videoTitle = videoInfo.video_details.title;
                const videoDuration = videoInfo.video_details.durationInSec;

                const serverQueue = queue.get(message.guild.id);
                
                if (!serverQueue) {
                    const queueConstruct = {
                        textChannel: message.channel,
                        voiceChannel: voiceChannel,
                        connection: null,
                        songs: [],
                        volume: 5,
                        playing: true
                    };

                    queue.set(message.guild.id, queueConstruct);
                    const songUrl = query.includes('youtube.com') || query.includes('youtu.be') ? query : results[0].url;
                    queueConstruct.songs.push({
                        title: videoTitle,
                        url: songUrl,
                        duration: videoDuration,
                        requestedBy: message.author
                    });

                    try {
                        const connection = joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: message.guild.id,
                            adapterCreator: message.guild.voiceAdapterCreator,
                        });

                        queueConstruct.connection = connection;
                        play(message.guild, queueConstruct.songs[0]);
                    } catch (error) {
                        console.error('Error joining voice channel:', error);
                        queue.delete(message.guild.id);
                        return message.reply('There was an error connecting to the voice channel!');
                    }
                } else {
                    const songUrl = query.includes('youtube.com') || query.includes('youtu.be') ? query : results[0].url;
                    serverQueue.songs.push({
                        title: videoTitle,
                        url: songUrl,
                        duration: videoDuration,
                        requestedBy: message.author
                    });

                    return message.reply(`Added to queue: ${videoTitle} (${formatDuration(videoDuration)}) - Position: ${serverQueue.songs.length}`);
                }

                message.reply(`Now playing: ${videoTitle} (${formatDuration(videoDuration)})`);

            } catch (error) {
                console.error('Error playing music:', error);
                message.reply('There was an error playing the song!');
            }
        } else if (subcommand === 'stop') {
            const serverQueue = queue.get(message.guild.id);
            if (!serverQueue) {
                return message.reply('There is no music playing!');
            }

            serverQueue.songs = [];
            serverQueue.connection.destroy();
            queue.delete(message.guild.id);

            message.reply('⏹️ Music stopped and queue cleared!');
        } else if (subcommand === 'skip') {
            const serverQueue = queue.get(message.guild.id);
            if (!serverQueue) {
                return message.reply('There is no music playing!');
            }

            serverQueue.connection.destroy();
            message.reply('⏭️ Skipped the current song!');
        } else if (subcommand === 'queue') {
            const serverQueue = queue.get(message.guild.id);
            if (!serverQueue || serverQueue.songs.length === 0) {
                return message.reply('The queue is empty!');
            }

            const queueList = serverQueue.songs.map((song, index) => 
                `${index + 1}. ${song.title} - ${song.requestedBy.tag}`
            ).join('\n');

            message.reply(`Music Queue:\n${queueList}`);
        } else {
            message.reply('Available commands: `play`, `stop`, `skip`, `queue`');
        }
    }
};

async function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    try {
        console.log('Playing song URL:', song.url);
        const videoInfo = await playDl.video_basic_info(song.url);
        const stream = await playDl.stream_from_info(videoInfo);
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });
        const player = createAudioPlayer();

        player.play(resource);
        serverQueue.connection.subscribe(player);

        player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle') {
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            }
        });
    } catch (error) {
        console.error('Error playing song:', error);
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    }
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}
