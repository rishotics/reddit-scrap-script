require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendAlert(post, analysis) {
  const message = `
✈️ *New Aviation Post — Worth Commenting!*

📌 *Subreddit:* ${post.subreddit}
📝 *Title:* ${post.title}
👤 *Author:* u/${post.author}
🔗 *Link:* ${post.permalink}

⭐ *Score:* ${analysis.score}/10
💡 *Why:* ${analysis.reason}

💬 *Suggested Comment:*
\`\`\`
${analysis.suggestedComment}
\`\`\`
`.trim();

  try {
    await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
    console.log(`[Telegram] Alert sent for post: "${post.title}"`);
  } catch (err) {
    console.error('[Telegram] Failed to send alert:', err.message);
  }
}

module.exports = { sendAlert };
