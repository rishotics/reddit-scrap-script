require('dotenv').config();
const { startPolling } = require('./reddit');
const { analyzePost } = require('./analyzer');
const { sendAlert } = require('./telegram');

const MAX_ALERTS_PER_HOUR = 10;

const sentPostIds = new Set();
let alertsThisHour = 0;

// reset counter every hour
setInterval(() => {
  console.log(`[Monitor] Hourly reset — sent ${alertsThisHour} alerts this hour.`);
  alertsThisHour = 0;
}, 60 * 60 * 1000);

async function handlePost(post) {
  // skip if already alerted for this post
  if (sentPostIds.has(post.id)) return;

  // skip if hourly limit reached
  if (alertsThisHour >= MAX_ALERTS_PER_HOUR) {
    console.log(`[Monitor] Hourly limit reached (${MAX_ALERTS_PER_HOUR}). Skipping: "${post.title}"`);
    return;
  }

  console.log(`[Monitor] New post on ${post.subreddit}: "${post.title}"`);

  const analysis = await analyzePost(post);
  console.log(`[Monitor] Score: ${analysis.score}/10 — ${analysis.reason}`);

  if (analysis.worthCommenting) {
    sentPostIds.add(post.id);
    alertsThisHour++;
    console.log(`[Monitor] Alert ${alertsThisHour}/${MAX_ALERTS_PER_HOUR} this hour.`);
    await sendAlert(post, analysis);
  }
}

function main() {
  console.log('💍 Matrimonial Reddit Monitor starting...\n');

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
