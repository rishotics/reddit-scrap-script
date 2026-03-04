const config = {
  subreddits: [
    'aviation',
    'planespotting',
    'flightsim',
    'MicrosoftFlightSim',
    'flying',
    'boeing',
    'airbus',
  ],
  pollInterval: 30000, // 30 seconds
  minScore: 7,         // minimum Claude score to trigger alert
  claudeModel: 'claude-haiku-4-5-20251001',
};

module.exports = config;
