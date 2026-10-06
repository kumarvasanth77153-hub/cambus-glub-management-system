import { getCache, setCache, deleteCache, deleteCachePattern } from '../config/redis.js';

export const cacheService = {
  get: getCache,
  set: setCache,
  del: deleteCache,
  delPattern: deleteCachePattern,

  // High-level student dashboard cache helper
  getStudentDashboard: async (studentId) => {
    return getCache(`student:dashboard:${studentId}`);
  },

  setStudentDashboard: async (studentId, data, ttl = 300) => {
    return setCache(`student:dashboard:${studentId}`, data, ttl);
  },

  invalidateStudent: async (studentId) => {
    return deleteCache(`student:dashboard:${studentId}`);
  },

  invalidateClub: async (clubId) => {
    return deleteCachePattern(`*club*${clubId}*`);
  },
};
