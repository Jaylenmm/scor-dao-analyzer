/**
 * Risk Calculator and Data Processing Utilities for Scor DAO Analysis
 * Implements sophisticated algorithms for assessing DAO creditworthiness
 */

import { ALGORITHM_WEIGHTS, RISK_THRESHOLDS } from '../constants/demoData';

/**
 * Calculates treasury health score based on total USD value
 * Uses logarithmic scaling to handle wide range of treasury sizes
 * @param {number} totalValueUSD - Total treasury value in USD
 * @returns {number} Treasury health score (0-100)
 */
export const calculateTreasuryHealth = (totalValueUSD) => {
  if (!totalValueUSD || totalValueUSD <= 0) return 0;
  
  // Logarithmic scaling: $100K = ~50 points, $1M = ~75 points, $10M+ = ~100 points
  const baseScore = Math.log10(totalValueUSD / 100000) * 25;
  return Math.round(Math.max(0, Math.min(100, baseScore)));
};

/**
 * Calculates activity score based on recent transaction frequency
 * @param {number} recentTransactions - Number of transactions in last 30 days
 * @returns {number} Activity score (0-100)
 */
export const calculateActivityScore = (recentTransactions) => {
  if (!recentTransactions || recentTransactions < 0) return 0;
  
  // Scale: 100+ transactions = 100 points, linear scaling below
  const score = Math.min(100, (recentTransactions / 5) * 5);
  return Math.round(score);
};

/**
 * Calculates diversification score based on asset distribution
 * @param {number} totalAssets - Number of different asset types
 * @param {number} ethRatio - Ratio of ETH to total portfolio value
 * @param {Array} holdings - Array of token holdings
 * @returns {number} Diversification score (0-100)
 */
export const calculateDiversificationScore = (totalAssets, ethRatio, holdings = []) => {
  if (!totalAssets || totalAssets <= 0) return 0;
  
  // Base score from number of assets (more assets = better diversification)
  const assetVarietyScore = Math.min(60, totalAssets * 15);
  
  // Penalty for over-concentration in ETH (>70% ETH is risky)
  const concentrationPenalty = Math.max(0, (ethRatio - 0.7) * 100);
  
  // Bonus for balanced distribution
  const balanceBonus = ethRatio < 0.7 && ethRatio > 0.3 ? 20 : 0;
  
  const finalScore = assetVarietyScore - concentrationPenalty + balanceBonus;
  return Math.max(0, Math.min(100, Math.round(finalScore)));
};

/**
 * Calculates maturity score based on wallet age
 * @param {string} firstTxTimestamp - Date of first transaction (ISO string or date string)
 * @returns {number} Maturity score (0-100)
 */
export const calculateMaturityScore = (firstTxTimestamp) => {
  if (!firstTxTimestamp) return 0;
  
  try {
    const firstTxDate = new Date(firstTxTimestamp);
    const now = new Date();
    const ageInYears = (now - firstTxDate) / (365 * 24 * 60 * 60 * 1000);
    
    if (ageInYears < 0) return 0; // Invalid future date
    
    // Score: 3+ years = 100 points, linear scaling below
    const score = Math.min(100, ageInYears * 30);
    return Math.round(score);
  } catch (error) {
    console.warn('Invalid timestamp for maturity calculation:', firstTxTimestamp);
    return 0;
  }
};

/**
 * Calculates transaction history score based on total transaction count
 * @param {number} totalTransactions - Total number of transactions
 * @returns {number} History score (0-100)
 */
export const calculateHistoryScore = (totalTransactions) => {
  if (!totalTransactions || totalTransactions <= 0) return 0;
  
  // Logarithmic scaling: 1000+ txs = ~75 points, 10000+ = ~100 points
  const score = Math.log10(totalTransactions) * 25;
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Main risk calculation function that combines all risk factors
 * @param {Object} etherscanData - Blockchain data from Etherscan
 * @param {Object} priceData - Price data from CoinGecko
 * @returns {Object} Complete risk analysis with scores and breakdown
 */
export const calculateComprehensiveRiskScore = (etherscanData, priceData) => {
  if (!etherscanData || !priceData) {
    throw new Error('Missing required data for risk calculation');
  }

  try {
    const { ethBalance, tokens, txCount, firstTxTimestamp, recentTxs } = etherscanData;
    const { ethPrice, tokenPrices } = priceData;

    // Calculate portfolio values
    const ethValue = parseFloat(ethBalance) * ethPrice;
    let tokenValue = 0;
    let validTokens = 0;
    
    tokens.forEach(token => {
      const price = tokenPrices[token.symbol];
      if (price && !isNaN(price)) {
        tokenValue += parseFloat(token.balance) * price;
        validTokens++;
      }
    });

    const totalValue = ethValue + tokenValue;
    const totalAssets = 1 + validTokens; // ETH + valid tokens
    const ethRatio = totalValue > 0 ? ethValue / totalValue : 1;

    // Calculate individual risk components
    const treasuryHealth = calculateTreasuryHealth(totalValue);
    const activityScore = calculateActivityScore(recentTxs);
    const diversificationScore = calculateDiversificationScore(totalAssets, ethRatio, tokens);
    const maturityScore = calculateMaturityScore(firstTxTimestamp);
    const historyScore = calculateHistoryScore(txCount);

    // Apply weighted algorithm
    const finalScore = Math.round(
      treasuryHealth * ALGORITHM_WEIGHTS.TREASURY_HEALTH + 
      activityScore * ALGORITHM_WEIGHTS.TRANSACTION_ACTIVITY + 
      diversificationScore * ALGORITHM_WEIGHTS.DIVERSIFICATION + 
      maturityScore * ALGORITHM_WEIGHTS.MATURITY + 
      historyScore * ALGORITHM_WEIGHTS.HISTORY
    );

    const result = {
      finalScore: Math.max(1, Math.min(100, finalScore)),
      breakdown: {
        treasury: treasuryHealth,
        activity: activityScore,
        diversification: diversificationScore,
        maturity: maturityScore,
        history: historyScore
      },
      portfolioMetrics: {
        totalValue,
        ethValue,
        tokenValue,
        assetCount: totalAssets,
        ethRatio: Math.round(ethRatio * 100) / 100,
        diversificationRatio: validTokens > 0 ? tokenValue / totalValue : 0
      },
      riskFactors: {
        highEthConcentration: ethRatio > 0.8,
        lowActivity: recentTxs < 10,
        newWallet: maturityScore < 30,
        smallTreasury: totalValue < 100000,
        limitedDiversification: validTokens < 2
      }
    };

    console.log('Risk calculation completed:', {
      finalScore: result.finalScore,
      treasuryValue: totalValue.toLocaleString(),
      riskFactors: Object.keys(result.riskFactors).filter(key => result.riskFactors[key])
    });

    return result;

  } catch (error) {
    console.error('Risk calculation error:', error);
    throw new Error(`Risk calculation failed: ${error.message}`);
  }
};

/**
 * Determines risk level based on score
 * @param {number} riskScore - Calculated risk score (0-100)
 * @returns {string} Risk level classification
 */
export const determineRiskLevel = (riskScore) => {
  if (riskScore >= RISK_THRESHOLDS.LOW) return 'Low';
  if (riskScore >= RISK_THRESHOLDS.MEDIUM_LOW) return 'Medium-Low';
  if (riskScore >= RISK_THRESHOLDS.MEDIUM) return 'Medium';
  return 'High';
};

/**
 * Generates credit decision recommendation
 * @param {number} riskScore - Calculated risk score
 * @returns {Object} Credit decision with reasoning
 */
export const generateCreditDecision = (riskScore) => {
  const riskLevel = determineRiskLevel(riskScore);
  
  const decisions = {
    'Low': {
      approved: true,
      recommendation: 'Approved for Financing',
      reasoning: 'Strong treasury, consistent activity, and low risk indicators',
      maxLoanRatio: 0.7 // Can lend up to 70% of treasury value
    },
    'Medium-Low': {
      approved: true,
      recommendation: 'Approved with Standard Terms',
      reasoning: 'Good financial health with minor risk factors',
      maxLoanRatio: 0.5
    },
    'Medium': {
      approved: false,
      recommendation: 'Requires Further Review',
      reasoning: 'Mixed risk indicators require additional due diligence',
      maxLoanRatio: 0.3
    },
    'High': {
      approved: false,
      recommendation: 'Not Recommended for Financing',
      reasoning: 'Significant risk factors present',
      maxLoanRatio: 0.1
    }
  };

  return decisions[riskLevel];
};