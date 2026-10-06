import Redis from 'ioredis';

let redisClient = null;
let isRedisAvailable = false;
const memoryStore = new Map();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't crash or spin endlessly if Redis is offline
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isRedisAvailable = true;
    console.log('[Redis] Connected successfully to ' + redisUrl);
  }).catch(() => {
    isRedisAvailable = false;
    console.log('[Redis] Offline or not reachable. Falling back smoothly to in-memory caching.');
  });

  redisClient.on('error', () => {
    isRedisAvailable = false;
  });
} catch {
  isRedisAvailable = false;
}

export const getCache = async (key) => {
  try {
    if (isRedisAvailable && redisClient) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
    const mem = memoryStore.get(key);
    if (!mem) return null;
    if (mem.expiry && Date.now() > mem.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return mem.data;
  } catch (err) {
    console.warn(`[Cache Error] get(${key}):`, err.message);
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    const stringified = JSON.stringify(value);
    if (isRedisAvailable && redisClient) {
      await redisClient.set(key, stringified, 'EX', ttlSeconds);
      return;
    }
    memoryStore.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  } catch (err) {
    console.warn(`[Cache Error] set(${key}):`, err.message);
  }
};

export const deleteCache = async (key) => {
  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.del(key);
    }
    memoryStore.delete(key);
  } catch (err) {
    console.warn(`[Cache Error] del(${key}):`, err.message);
  }
};

export const deleteCachePattern = async (pattern) => {
  try {
    if (isRedisAvailable && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
    // Clear matching keys from memory store
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const k of memoryStore.keys()) {
      if (regex.test(k)) {
        memoryStore.delete(k);
      }
    }
  } catch (err) {
    console.warn(`[Cache Error] deleteCachePattern(${pattern}):`, err.message);
  }
};

export default redisClient;
