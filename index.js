require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const MongoClient = require('mongodb').MongoClient;

const uri = process.env.DB_URI;
const token = process.env.BOT_TOKEN;

const dbClient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const bot = new TelegramBot(token, { polling: true });

dbClient.connect((err) => {
    const collection = dbClient.db('Icobot-API').collection('icons');
    dbClient.close();
});

bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    bot.sendMessage(chatId, resp);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Received your message');
});
