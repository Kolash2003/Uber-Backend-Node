const redis = require('redis');


const redisClient = redis.createClient();
redisClient.connect().catch(console.error);

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.log("Redis connection error: ", err);
});

module.exports = redisClient;
