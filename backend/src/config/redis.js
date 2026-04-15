const { createClient } = require('redis');

const redisClient = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD || 'redispassword123'}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('[REDIS] Client Error', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('[REDIS] Connected successfully');
  } catch (error) {
    console.error('[REDIS] Connection failed:', error);
  }
};

module.exports = { redisClient, connectRedis };
