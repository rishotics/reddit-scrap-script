require('dotenv').config();
const Snoowrap = require('snoowrap');
const { SubmissionStream } = require('snoostorm');
const config = require('./config');

function createRedditClient() {
  return new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });
}

function startStreams(client, onPost) {
  for (const subreddit of config.subreddits) {
    const stream = new SubmissionStream(client, {
      subreddit,
      limit: 10,
      pollTime: config.pollInterval,
    });

    stream.on('item', (post) => {
      onPost({
        id: post.id,
        title: post.title,
        body: post.selftext || '',
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        subreddit: post.subreddit_name_prefixed,
        author: post.author.name,
      });
    });

    stream.on('error', (err) => {
      console.error(`[Reddit] Stream error on r/${subreddit}:`, err.message);
    });

    console.log(`[Reddit] Monitoring r/${subreddit}`);
  }
}

module.exports = { createRedditClient, startStreams };
