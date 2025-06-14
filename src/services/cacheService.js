// FILE: src/services/cacheService.js
/**
 * Cache Service for Scor DAO Analysis
 * Handles 24-hour caching of analysis results
 */

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Retrieves cached analysis data for an address
 * @param {string} address - DAO address
 * @returns {Object|null} Cached data or null if expired/not found
 */
export const getCachedAnalysis = (address) => {
  try {
    const cached = localStorage.getItem(`scor_analysis_${address.toLowerCase()}`);
    
    if (!cached) {
      return null;
    }
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      console.log(`Using cached data for ${address} (${Math.round(age / 1000 / 60)} minutes old)`);
      return { ...data, cacheTimestamp: timestamp };
    } else {
      // Remove expired cache
      localStorage.removeItem(`scor_analysis_${address.toLowerCase()}`);
      console.log(`Cache expired for ${address}, will fetch fresh data`);
      return null;
    }
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

/**
 * Stores analysis data in cache
 * @param {string} address - DAO address
 * @param {Object} data - Analysis data to cache
 */
export const setCachedAnalysis = (address, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(
      `scor_analysis_${address.toLowerCase()}`, 
      JSON.stringify(cacheEntry)
    );
    
    console.log(`Cached analysis for ${address}`);
  } catch (error) {
    console.error('Cache storage error:', error);
    // Continue without caching rather than failing
  }
};

/**
 * Clears all cached analysis data
 */
export const clearAnalysisCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('scor_analysis_'));
    
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`Cleared ${cacheKeys.length} cached analyses`);
    return cacheKeys.length;
  } catch (error) {
    console.error('Cache clearing error:', error);
    return 0;
  }
};

/**
 * Gets cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('scor_analysis_'));
    
    const stats = {
      totalCached: cacheKeys.length,
      cacheEntries: []
    };
    
    cacheKeys.forEach(key => {
      try {
        const cached = JSON.parse(localStorage.getItem(key));
        const address = key.replace('scor_analysis_', '');
        const age = Date.now() - cached.timestamp;
        const isExpired = age > CACHE_DURATION;
        
        stats.cacheEntries.push({
          address,
          timestamp: cached.timestamp,
          age: Math.round(age / 1000 / 60), // Age in minutes
          isExpired,
          daoName: cached.data?.name || 'Unknown'
        });
      } catch (entryError) {
        console.warn(`Corrupted cache entry: ${key}`);
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Cache stats error:', error);
    return { totalCached: 0, cacheEntries: [] };
  }
};
