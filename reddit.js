const config = require('./config');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function parseAtom(xml) {
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const getText = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };

    const link = entry.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/)?.[1] || '';
    const id = link.split('/comments/')[1]?.split('/')[0] || Math.random().toString(36).slice(2);
    const subredditMatch = link.match(/reddit\.com\/r\/([^/]+)/);
    const author = entry.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)?.[1] || 'unknown';
    const updated = getText('updated');
    const title = getText('title');
    const content = getText('content').replace(/<[^>]+>/g, '').slice(0, 500);

    items.push({
      id,
      title,
      body: content,
      url: link,
      permalink: link,
      subreddit: subredditMatch ? `r/${subredditMatch[1]}` : 'r/unknown',
      author,
      createdAt: updated ? new Date(updated).getTime() / 1000 : Date.now() / 1000,
    });
  }

  return items;
}

async function fetchNewPosts(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/new.rss?limit=10`;
  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) throw new Error(`HTTP ${res.status} for r/${subreddit}`);

  const xml = await res.text();
  return parseAtom(xml);
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
      await new Promise((r) => setTimeout(r, 1000));
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
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.log('[Reddit] Seeding complete. Now watching for new posts...\n');
    setInterval(poll, config.pollInterval);
  }

  seed();
}

module.exports = { startPolling };
