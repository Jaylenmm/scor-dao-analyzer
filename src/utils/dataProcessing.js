/**
 * Data Processing Utilities for DAO Analysis
 * Handles transformation of raw blockchain data into analysis-ready formats
 */

/**
 * Builds formatted holdings data for display and analysis
 * @param {Object} etherscanData - Raw blockchain data
 * @param {Object} priceData - Token price data
 * @param {Object} riskAnalysis - Risk analysis results
 * @returns {Array} Formatted holdings array
 */
export const buildFormattedHoldings = (etherscanData, priceData, riskAnalysis) => {
    if (!etherscanData || !priceData || !riskAnalysis) {
      return [];
    }
  
    try {
      const holdings = [];
      const { ethBalance, tokens } = etherscanData;
      const { ethPrice, tokenPrices } = priceData;
      const { portfolioMetrics } = riskAnalysis;
  
      // Add ETH holding
      const ethValue = parseFloat(ethBalance) * ethPrice;
      holdings.push({
        token: 'ETH',
        symbol: 'ETH',
        amount: parseFloat(ethBalance).toFixed(4),
        rawAmount: parseFloat(ethBalance),
        value: ethValue,
        percentage: Math.round((ethValue / portfolioMetrics.totalValue) * 100),
        pricePerToken: ethPrice,
        isStablecoin: false,
        riskLevel: 'medium' // ETH is considered medium risk
      });
  
      // Add token holdings
      tokens.forEach(token => {
        const price = tokenPrices[token.symbol];
        if (price && !isNaN(price)) {
          const tokenBalance = parseFloat(token.balance);
          const value = tokenBalance * price;
          const percentage = Math.round((value / portfolioMetrics.totalValue) * 100);
  
          holdings.push({
            token: token.symbol,
            symbol: token.symbol,
            amount: tokenBalance.toLocaleString(),
            rawAmount: tokenBalance,
            value: value,
            percentage: percentage,
            pricePerToken: price,
            contractAddress: token.contractAddress,
            isStablecoin: ['USDC', 'USDT', 'DAI', 'BUSD'].includes(token.symbol.toUpperCase()),
            riskLevel: determineTokenRiskLevel(token.symbol, percentage)
          });
        }
      });
  
      // Sort by value (highest first)
      holdings.sort((a, b) => b.value - a.value);
  
      return holdings;
  
    } catch (error) {
      console.error('Holdings processing error:', error);
      return [];
    }
  };
  
  /**
   * Determines risk level for individual tokens
   * @param {string} symbol - Token symbol
   * @param {number} percentage - Percentage of total portfolio
   * @returns {string} Risk level classification
   */
  const determineTokenRiskLevel = (symbol, percentage) => {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];
    const bluechips = ['WBTC', 'LINK', 'UNI', 'AAVE'];
    
    if (stablecoins.includes(symbol.toUpperCase())) {
      return 'low';
    } else if (bluechips.includes(symbol.toUpperCase())) {
      return percentage > 30 ? 'medium' : 'low';
    } else {
      return percentage > 20 ? 'high' : 'medium';
    }
  };
  
  /**
   * Calculates portfolio diversification metrics
   * @param {Array} holdings - Array of token holdings
   * @returns {Object} Diversification analysis
   */
  export const analyzePortfolioDiversification = (holdings) => {
    if (!holdings || holdings.length === 0) {
      return {
        totalAssets: 0,
        stablecoinRatio: 0,
        topHoldingConcentration: 100,
        diversificationScore: 0,
        riskDistribution: { low: 0, medium: 0, high: 0 }
      };
    }
  
    const totalAssets = holdings.length;
    const stablecoinValue = holdings
      .filter(h => h.isStablecoin)
      .reduce((sum, h) => sum + h.value, 0);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    
    const stablecoinRatio = totalValue > 0 ? stablecoinValue / totalValue : 0;
    const topHoldingConcentration = holdings.length > 0 ? holdings[0].percentage : 0;
    
    // Calculate risk distribution
    const riskDistribution = holdings.reduce((dist, holding) => {
      const riskWeight = holding.percentage / 100;
      dist[holding.riskLevel] += riskWeight;
      return dist;
    }, { low: 0, medium: 0, high: 0 });
  
    // Simple diversification score (can be enhanced)
    let diversificationScore = 50; // Base score
    diversificationScore += Math.min(30, totalAssets * 5); // More assets = better
    diversificationScore -= Math.max(0, topHoldingConcentration - 50); // Concentration penalty
    diversificationScore += stablecoinRatio * 20; // Stablecoin bonus
  
    return {
      totalAssets,
      stablecoinRatio: Math.round(stablecoinRatio * 100) / 100,
      topHoldingConcentration,
      diversificationScore: Math.max(0, Math.min(100, Math.round(diversificationScore))),
      riskDistribution: {
        low: Math.round(riskDistribution.low * 100),
        medium: Math.round(riskDistribution.medium * 100),
        high: Math.round(riskDistribution.high * 100)
      }
    };
  };
  
  /**
   * Generates activity analysis from transaction data
   * @param {Object} etherscanData - Blockchain transaction data
   * @returns {Object} Activity analysis
   */
  export const analyzeTransactionActivity = (etherscanData) => {
    const { recentTxs, txCount, firstTxTimestamp } = etherscanData;
    
    const activityLevel = recentTxs > 100 ? 'Very High' : 
                         recentTxs > 50 ? 'High' :
                         recentTxs > 20 ? 'Medium' :
                         recentTxs > 5 ? 'Low' : 'Very Low';
  
    const lastActivity = recentTxs > 100 ? '2 hours ago' : 
                        recentTxs > 50 ? '1 day ago' :
                        recentTxs > 10 ? '3 days ago' : 
                        recentTxs > 0 ? '1 week ago' : '2+ weeks ago';
  
    const treasuryStability = recentTxs > 50 ? 'Stable' : 
                             recentTxs > 20 ? 'Moderate' : 'Volatile';
  
    return {
      activityLevel,
      lastActivity,
      treasuryStability,
      totalTransactions: txCount,
      recentTransactions: recentTxs,
      averageMonthlyActivity: Math.round(recentTxs), // 30-day window
      walletAge: firstTxTimestamp
    };
  };