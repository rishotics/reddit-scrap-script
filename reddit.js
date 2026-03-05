const config = require('./config');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchNewPosts(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=10&raw_json=1`;
  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) throw new Error(`HTTP ${res.status} for r/${subreddit}`);

  const data = await res.json();
  return data.data.children.map((child) => ({
    id: child.data.id,
    title: child.data.title,
    body: child.data.selftext || '',
    url: child.data.url,
    permalink: `https://reddit.com${child.data.permalink}`,
    subreddit: child.data.subreddit_name_prefixed,
    author: child.data.author,
    createdAt: child.data.created_utc,
  }));
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
            // skip posts older than 10 minutes on startup to avoid spam
            const ageSeconds = Date.now() / 1000 - post.createdAt;
            if (ageSeconds < 600) onPost(post);
          }
        }
      } catch (err) {
        console.error(`[Reddit] Error polling r/${subreddit}:`, err.message);
      }

      // small delay between subreddits to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // initial poll to seed seenIds without triggering alerts
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
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.log('[Reddit] Seeding complete. Now watching for new posts...\n');
    setInterval(poll, config.pollInterval);
  }

  seed();
}

module.exports = { startPolling };
