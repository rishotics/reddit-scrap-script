require('dotenv').config();
const { startPolling } = require('./reddit');
const { analyzePost } = require('./analyzer');
const { sendAlert } = require('./telegram');

async function handlePost(post) {
  console.log(`[Monitor] New post on ${post.subreddit}: "${post.title}"`);

  const analysis = await analyzePost(post);
  console.log(`[Monitor] Score: ${analysis.score}/10 — ${analysis.reason}`);

  if (analysis.worthCommenting) {
    await sendAlert(post, analysis);
  }
}

function main() {
  console.log('🛫 Aviation Reddit Monitor starting...\n');

  const missingKeys = [
    'ANTHROPIC_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
  ].filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    console.error('❌ Missing environment variables:', missingKeys.join(', '));
    console.error('Please fill in your .env file and try again.');
    process.exit(1);
  }

  startPolling(handlePost);
}

main();
