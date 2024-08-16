// api/bot.js
const TelegramBot = require('node-telegram-bot-api');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(botToken);

// Function to handle webhook updates
module.exports = async (req, res) => {
    try {
        const update = req.body;
        const message = update.message.text;

        // Echo back the received message
        await bot.sendMessage(update.message.chat.id, `Received: ${message}`);

        res.status(200).json({ message: 'Message received and echoed back' });
    } catch (error) {
        console.error('Error processing update:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
