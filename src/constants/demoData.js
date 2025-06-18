// FILE: src/constants/demoData.js
/**
 * Demo Data and Constants for Scor MVP
 */

// Real DAO treasury addresses for demo
export const DEMO_ADDRESSES = [
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance 14
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 15  
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance 16
    '0x9696f59e4d72e237be84ffd425dcad154bf96976', // Yearn Treasury
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // Compound cDAI
    '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // Synthetix SNX
  ];
  
  export const DAO_NAMES = {
    '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance 15',  
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 16',
    '0x9696f59e4d72e237be84ffd425dcad154bf96976': 'Yearn Treasury',
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643': 'Compound cDAI',
    '0x57ab1ec28d129707052df4df418d58a2d46d5f51': 'Synthetix SNX',
  };
  
  // Risk level thresholds
  export const RISK_THRESHOLDS = {
    LOW: 80,
    MEDIUM_LOW: 65,
    MEDIUM: 45,
    HIGH: 0
  };
  
  // Algorithm weights
  export const ALGORITHM_WEIGHTS = {
    TREASURY_HEALTH: 0.30,
    TRANSACTION_ACTIVITY: 0.25,
    DIVERSIFICATION: 0.20,
    MATURITY: 0.15,
    HISTORY: 0.10
  };
  
  // Cache settings
  export const CACHE_SETTINGS = {
    DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
    PREFIX: 'scor_analysis_',
    EMAIL_PREFIX: 'scor_email_'
  };