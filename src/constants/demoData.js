// FILE: src/constants/demoData.js
/**
 * Demo Data and Constants for Scor MVP
 */

// Real DAO treasury addresses for demo
export const DEMO_ADDRESSES = [
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance 14
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 15  
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance 16
    '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', // Binance 17
    '0x9696f59e4d72e237be84ffd425dcad154bf96976', // Yearn Treasury
    '0x93a62da5a14c80f265dabc077fcee437b1a0efde', // Yearn Multisig
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // Compound cDAI
    '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', // Compound Ether  
    '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // Synthetix SNX
    '0xa0b86a33e6411cbfc773c6e1f5e4c5c6ee9fc91c', // HexTrust DAO (if real)
    '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MakerDAO MKR Token
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // Uniswap UNI Token
  ];
  
  // Friendly names for demo addresses
  export const DAO_NAMES = {
    '0x28c6c06298d514db089934071355e5743bf21d60': 'Enterprise Treasury A',
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Enterprise Treasury B',  
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Enterprise Treasury C',
    '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': 'Enterprise Treasury D',
    '0x9696f59e4d72e237be84ffd425dcad154bf96976': 'DeFi Protocol Treasury',
    '0x93a62da5a14c80f265dabc077fcee437b1a0efde': 'DeFi Protocol Multisig',
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643': 'Compound cDAI',
    '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b': 'Compound Ether  ',
    '0x57ab1ec28d129707052df4df418d58a2d46d5f51': 'Synthetix SNX',
    '0xa0b86a33e6411cbfc773c6e1f5e4c5c6ee9fc91c': 'HexTrust DAO (if real)',
    '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': 'MakerDAO MKR Token',
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'Uniswap UNI Token',
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