# Matrimonial Reddit Monitor

## Overview
Node.js bot that monitors Indian matrimonial/relationship subreddits for engagement opportunities. Sends Telegram alerts with AI-generated comment suggestions.

## Architecture
- `index.js` — Entry point. Handles deduplication (Set of post IDs) and rate limiting (10 alerts/hour).
- `reddit.js` — Fetches Reddit Atom feeds (no API auth needed). Parses XML entries.
- `analyzer.js` — Sends posts to Claude Haiku for scoring and comment generation. Returns JSON with score, reason, suggestedComment.
- `telegram.js` — Sends formatted Markdown alerts to a Telegram chat via Bot API.
- `config.js` — Subreddit list, poll interval (30s), min score (7), Claude model.

## Key Details
- Uses Reddit's public Atom feeds, not the authenticated API
- Claude model: `claude-haiku-4-5-20251001`
- Telegram messages use Markdown parse mode
- All secrets in `.env` (never commit)

## Commands
- `node index.js` — Start the monitor
- `npm install` — Install dependencies
