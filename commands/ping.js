module.exports = {
    name: 'ping',
    description: 'Check bot latency',
    aliases: ['latency'],
    execute(message, args) {
        const start = Date.now();
        message.reply('Pong!').then(msg => {
            const end = Date.now();
            const latency = end - start;
            const apiLatency = Math.round(message.client.ws.ping);
            
            msg.edit(`Pong!\nBot Latency: ${latency}ms\nAPI Latency: ${apiLatency}ms`);
        });
    }
};
