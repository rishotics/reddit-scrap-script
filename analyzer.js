require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');

const client = new Anthropic.default();

const INFLUENCER_CONTEXT = `
You are an aviation Instagram content creator and avgeek expert. Your audience is hardcore aviation enthusiasts
who know registrations, liveries, and ICAO codes. You follow and engage with the top aviation creators' styles:
Sam Chui, Captain Joe, Cargospotter, and the planespotting community.

Your commenting style:
- Always name specific aircraft types, variants, registrations when relevant
- Add value with facts the community might not know
- Never be vague — say "Boeing 747-400" not "a plane"
- Be conversational, enthusiastic, never arrogant
- Comments should feel natural, not promotional
- Share personal insights or historical context when relevant
`;

async function analyzePost(post) {
  const prompt = `
${INFLUENCER_CONTEXT}

Analyze this Reddit post from ${post.subreddit} and decide if it's a good opportunity to comment:

Title: ${post.title}
Body: ${post.body || '(no body text)'}

Evaluate:
1. Is this post relevant to aviation, planespotting, flight simulation, or aircraft history?
2. Can you add genuine value with a knowledgeable comment?
3. Score it 1-10 (10 = perfect opportunity, 1 = not relevant)

If score >= ${config.minScore}, write a suggested comment that:
- Adds real value (a fact, insight, or personal angle)
- Feels natural and conversational
- Is NOT promotional or self-advertising
- Is 2-5 sentences max

Respond ONLY with valid JSON in this exact format:
{
  "worthCommenting": true or false,
  "score": number,
  "reason": "brief reason why this is or isn't worth commenting on",
  "suggestedComment": "the comment text, or empty string if not worth commenting"
}
`;

  try {
    const response = await client.messages.create({
      model: config.claudeModel,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[Analyzer] Error analyzing post:', err.message);
    return { worthCommenting: false, score: 0, reason: 'Analysis failed', suggestedComment: '' };
  }
}

module.exports = { analyzePost };
