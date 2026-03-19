const config = {
  subreddits: [
    'IndianMatchmaking',
    'Arrangedmarriage',
    'desiweddings',
    'ABCDesis',
    'RelationshipIndia',
    'TwoXIndia',
    'IndianBoysOnTinder',
  ],
  pollInterval: 120000, // 2 minutes
  minScore: 7,         // minimum Claude score to trigger alert
  claudeModel: 'claude-haiku-4-5-20251001',
};

module.exports = config;
