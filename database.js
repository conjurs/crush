const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'bot_data.db');
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                moderator TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                auto_role_id TEXT,
                mod_log_channel_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS welcome_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, channel_id)
            )`,
            `CREATE TABLE IF NOT EXISTS giveaway_counter (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                counter INTEGER DEFAULT 1
            )`,
            `CREATE TABLE IF NOT EXISTS deleted_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                content TEXT,
                attachments TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS sticky_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                message TEXT NOT NULL,
                enabled BOOLEAN DEFAULT 1,
                last_message_id TEXT,
                last_sticky_time INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, channel_id)
            )`,
            `CREATE TABLE IF NOT EXISTS afk_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS tempbans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                unban_time INTEGER NOT NULL,
                reason TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, user_id)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database run error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database get error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database all error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async addWarning(guildId, userId, reason, moderator, moderatorId) {
        const sql = `INSERT INTO warnings (guild_id, user_id, reason, moderator, moderator_id) 
                     VALUES (?, ?, ?, ?, ?)`;
        return await this.run(sql, [guildId, userId, reason, moderator, moderatorId]);
    }

    async getWarnings(guildId, userId = null) {
        let sql = `SELECT * FROM warnings WHERE guild_id = ?`;
        let params = [guildId];
        
        if (userId) {
            sql += ` AND user_id = ?`;
            params.push(userId);
        }
        
        sql += ` ORDER BY timestamp DESC`;
        return await this.all(sql, params);
    }

    async clearWarnings(guildId, userId) {
        const sql = `DELETE FROM warnings WHERE guild_id = ? AND user_id = ?`;
        return await this.run(sql, [guildId, userId]);
    }

    async getWarningCount(guildId, userId) {
        const sql = `SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?`;
        const result = await this.get(sql, [guildId, userId]);
        return result ? result.count : 0;
    }

    async setGuildSetting(guildId, setting, value) {
        const sql = `INSERT OR REPLACE INTO guild_settings (guild_id, ${setting}, updated_at) 
                     VALUES (?, ?, CURRENT_TIMESTAMP)`;
        return await this.run(sql, [guildId, value]);
    }

    async getGuildSetting(guildId, setting) {
        const sql = `SELECT ${setting} FROM guild_settings WHERE guild_id = ?`;
        const result = await this.get(sql, [guildId]);
        return result ? result[setting] : null;
    }

    async getAllGuildSettings() {
        const sql = `SELECT * FROM guild_settings`;
        return await this.all(sql);
    }

    async addWelcomeMessage(guildId, channelId, message) {
        const sql = `INSERT OR REPLACE INTO welcome_messages (guild_id, channel_id, message) 
                     VALUES (?, ?, ?)`;
        return await this.run(sql, [guildId, channelId, message]);
    }

    async getWelcomeMessages(guildId) {
        const sql = `SELECT * FROM welcome_messages WHERE guild_id = ?`;
        return await this.all(sql, [guildId]);
    }

    async removeWelcomeMessage(guildId, channelId) {
        const sql = `DELETE FROM welcome_messages WHERE guild_id = ? AND channel_id = ?`;
        return await this.run(sql, [guildId, channelId]);
    }

    async getNextGiveawayId() {
        const sql = `SELECT counter FROM giveaway_counter ORDER BY id DESC LIMIT 1`;
        const result = await this.get(sql);
        const counter = result ? result.counter + 1 : 1;
        
        await this.run(`INSERT INTO giveaway_counter (counter) VALUES (?)`, [counter]);
        return counter;
    }

    async addDeletedMessage(guildId, channelId, userId, username, content, attachments) {
        const sql = `INSERT INTO deleted_messages (guild_id, channel_id, user_id, username, content, attachments) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return await this.run(sql, [guildId, channelId, userId, username, content, attachments]);
    }

    async getLatestDeletedMessage(guildId, channelId) {
        const sql = `SELECT * FROM deleted_messages 
                     WHERE guild_id = ? AND channel_id = ? 
                     ORDER BY timestamp DESC LIMIT 1`;
        return await this.get(sql, [guildId, channelId]);
    }

    async clearDeletedMessages(guildId, channelId = null) {
        let sql = `DELETE FROM deleted_messages WHERE guild_id = ?`;
        let params = [guildId];
        
        if (channelId) {
            sql += ` AND channel_id = ?`;
            params.push(channelId);
        }
        
        return await this.run(sql, params);
    }

    async setStickyMessage(guildId, channelId, message, enabled = true, lastMessageId = null, lastStickyTime = 0) {
        const sql = `INSERT OR REPLACE INTO sticky_messages (guild_id, channel_id, message, enabled, last_message_id, last_sticky_time, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
        return await this.run(sql, [guildId, channelId, message, enabled ? 1 : 0, lastMessageId, lastStickyTime]);
    }

    async getStickyMessage(guildId, channelId) {
        const sql = `SELECT * FROM sticky_messages WHERE guild_id = ? AND channel_id = ?`;
        return await this.get(sql, [guildId, channelId]);
    }

    async getAllStickyMessages() {
        const sql = `SELECT * FROM sticky_messages WHERE enabled = 1`;
        return await this.all(sql);
    }

    async removeStickyMessage(guildId, channelId) {
        const sql = `DELETE FROM sticky_messages WHERE guild_id = ? AND channel_id = ?`;
        return await this.run(sql, [guildId, channelId]);
    }

    async setAfkUser(guildId, userId, message, timestamp) {
        const sql = `INSERT OR REPLACE INTO afk_users (guild_id, user_id, message, timestamp) 
                     VALUES (?, ?, ?, ?)`;
        return await this.run(sql, [guildId, userId, message, timestamp]);
    }

    async getAfkUser(guildId, userId) {
        const sql = `SELECT * FROM afk_users WHERE guild_id = ? AND user_id = ?`;
        return await this.get(sql, [guildId, userId]);
    }

    async removeAfkUser(guildId, userId) {
        const sql = `DELETE FROM afk_users WHERE guild_id = ? AND user_id = ?`;
        return await this.run(sql, [guildId, userId]);
    }

    async getAllAfkUsers() {
        const sql = `SELECT * FROM afk_users`;
        return await this.all(sql);
    }

    async setTempban(guildId, userId, unbanTime, reason, moderatorId) {
        const sql = `INSERT OR REPLACE INTO tempbans (guild_id, user_id, unban_time, reason, moderator_id) 
                     VALUES (?, ?, ?, ?, ?)`;
        return await this.run(sql, [guildId, userId, unbanTime, reason, moderatorId]);
    }

    async getTempban(guildId, userId) {
        const sql = `SELECT * FROM tempbans WHERE guild_id = ? AND user_id = ?`;
        return await this.get(sql, [guildId, userId]);
    }

    async getAllTempbans(guildId = null) {
        let sql = `SELECT * FROM tempbans`;
        let params = [];
        
        if (guildId) {
            sql += ` WHERE guild_id = ?`;
            params.push(guildId);
        }
        
        return await this.all(sql, params);
    }

    async removeTempban(guildId, userId) {
        const sql = `DELETE FROM tempbans WHERE guild_id = ? AND user_id = ?`;
        return await this.run(sql, [guildId, userId]);
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new Database();
