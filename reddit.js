const config = require('./config');

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are required in .env');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MatriMonitor/1.0 (by rishotics)',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`OAuth failed: HTTP ${res.status}`);

  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('[Reddit] OAuth token acquired');
  return accessToken;
}

async function fetchNewPosts(subreddit) {
  const token = await getAccessToken();
  const url = `https://oauth.reddit.com/r/${subreddit}/new?limit=10&raw_json=1`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'MatriMonitor/1.0 (by rishotics)',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} for r/${subreddit}`);

  const data = await res.json();
  const posts = data.data.children.map((child) => {
    const p = child.data;
    return {
      id: p.id,
      title: p.title,
      body: (p.selftext || '').slice(0, 500),
      url: `https://www.reddit.com${p.permalink}`,
      permalink: `https://www.reddit.com${p.permalink}`,
      subreddit: `r/${p.subreddit}`,
      author: p.author,
      createdAt: p.created_utc,
    };
  });

  return posts;
}

function startPolling(onPost) {
  const seenIds = new Set();

  async function poll() {
    for (const subreddit of config.subreddits) {
      try {
        const posts = await fetchNewPosts(subreddit);
        for (const post of posts) {
          if (!seenIds.has(post.id)) {
            seenIds.add(post.id);
            const ageSeconds = Date.now() / 1000 - post.createdAt;
            if (ageSeconds < 600) onPost(post);
          }
        }
      } catch (err) {
        console.error(`[Reddit] Error polling r/${subreddit}:`, err.message);
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  async function seed() {
    console.log('[Reddit] Seeding seen post IDs...');
    for (const subreddit of config.subreddits) {
      try {
        const posts = await fetchNewPosts(subreddit);
        posts.forEach((p) => seenIds.add(p.id));
        console.log(`[Reddit] Monitoring r/${subreddit}`);
      } catch (err) {
        console.error(`[Reddit] Seed error on r/${subreddit}:`, err.message);
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    console.log('[Reddit] Seeding complete. Now watching for new posts...\n');
    setInterval(poll, config.pollInterval);
  }

  seed();
}

module.exports = { startPolling };
