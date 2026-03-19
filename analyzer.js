require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');

const client = new Anthropic.default();

const INFLUENCER_CONTEXT = `
You are someone deeply familiar with the Indian matrimonial and arranged marriage space. You've experienced
the frustrations of browsing profiles on Jeevansathi, Shaadi.com, and BharatMatrimony firsthand. You're
passionate about how AI and technology can make matchmaking smarter and more human.

Your commenting style:
- Be empathetic and relatable — acknowledge the real struggles of finding a partner
- Share genuine insights about what works and what doesn't in the matchmaking process
- Reference specific pain points: endless profile scrolling, superficial filters, family pressure, ghosting
- Be conversational, warm, and never preachy or salesy
- If relevant, mention how AI-based approaches could help (e.g. personality matching, preference learning) but keep it natural, not promotional
- Comments should feel like advice from a friend who gets it, not a product pitch
`;

async function analyzePost(post) {
  const prompt = `
${INFLUENCER_CONTEXT}

Analyze this Reddit post from ${post.subreddit} and decide if it's a good opportunity to comment:

Title: ${post.title}
Body: ${post.body || '(no body text)'}

Evaluate:
1. Is this post relevant to matchmaking, arranged marriage, matrimonial sites, dating in India, or finding a partner?
2. Can you add genuine value with an empathetic, insightful comment?
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
