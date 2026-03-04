require('dotenv').config();
const { createRedditClient, startStreams } = require('./reddit');
const { analyzePost } = require('./analyzer');
const { sendAlert } = require('./telegram');

const seenPostIds = new Set();

async function handlePost(post) {
  // skip if already seen
  if (seenPostIds.has(post.id)) return;
  seenPostIds.add(post.id);

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
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET',
    'REDDIT_USERNAME',
    'REDDIT_PASSWORD',
    'REDDIT_USER_AGENT',
    'ANTHROPIC_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
  ].filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    console.error('❌ Missing environment variables:', missingKeys.join(', '));
    console.error('Please fill in your .env file and try again.');
    process.exit(1);
  }

  const redditClient = createRedditClient();
  startStreams(redditClient, handlePost);

  console.log('✅ Monitoring active. Waiting for new posts...\n');
}

main();
