# Matrimonial Reddit Monitor

AI-powered Reddit monitor that watches Indian matrimonial and relationship subreddits for posts worth engaging with. Uses Claude AI to analyze posts and suggests empathetic, insightful comments. Alerts are sent via Telegram DM.

## What it does

- Polls Reddit subreddits every 30 seconds for new posts
- Uses Claude Haiku to score each post (1-10) for engagement potential
- Sends Telegram alerts with suggested comments for high-scoring posts (7+)
- Deduplicates posts and rate-limits to 10 alerts/hour

## Monitored Subreddits

- r/IndianMatchmaking
- r/Arrangedmarriage
- r/desiweddings
- r/ABCDesis
- r/RelationshipIndia
- r/TwoXIndia
- r/IndianBoysOnTinder

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from the example:
   ```bash
   cp .env.example .env
   ```
4. Fill in your keys in `.env`:
   - `ANTHROPIC_API_KEY` — from [Anthropic Console](https://console.anthropic.com/)
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_CHAT_ID` — your Telegram user ID

5. Run:
   ```bash
   node index.js
   ```

## Project Structure

```
├── index.js        # Entry point, orchestration, dedup & rate limiting
├── config.js       # Subreddits, polling interval, score threshold
├── reddit.js       # Reddit Atom feed polling
├── analyzer.js     # Claude AI post analysis
├── telegram.js     # Telegram alert delivery
├── .env.example    # Environment variable template
```

## Related

This bot supports [Cupid on Steroids](https://github.com/nlok5923/matri-extension) — an AI-powered matrimonial profile scanner Chrome extension that uses Claude to evaluate and score matches on Jeevansathi.
