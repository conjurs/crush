const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname);
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') && file !== 'index.js');

const events = {};

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const eventModule = require(filePath);
    
    if (eventModule.name) {
        events[eventModule.name] = eventModule;
    } else {
        for (const [key, event] of Object.entries(eventModule)) {
            if (event.name) {
                events[event.name] = event;
            }
        }
    }
}

module.exports = events;
