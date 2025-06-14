/**
 * API Services for Scor DAO Analysis
 * Handles communication with Etherscan and CoinGecko APIs
 */

/**
 * Fetches comprehensive blockchain data for a DAO address
 * @param {string} address - Ethereum wallet address
 * @returns {Promise<Object>} Blockchain data including balance, tokens, transactions
 */
export const fetchEtherscanData = async (address) => {
    try {
      console.log('Fetching real blockchain data for:', address);
      
      const response = await fetch(`/api/analyze?address=${address}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch blockchain data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Blockchain analysis failed');
      }
      
      console.log('Real blockchain data received:', {
        ethBalance: data.ethBalance,
        tokenCount: data.tokens.length,
        txCount: data.txCount,
        recentTxs: data.recentTxs
      });
      
      // Format data to match application expectations
      return {
        ethBalance: data.ethBalance,
        tokens: data.tokens.map(token => ({
          contractAddress: token.contractAddress,
          balance: token.balance,
          symbol: token.symbol
        })),
        txCount: data.txCount,
        firstTxTimestamp: data.firstTxTimestamp,
        recentTxs: data.recentTxs
      };
      
    } catch (error) {
      console.error('Etherscan API error:', error);
      throw new Error(`Failed to fetch blockchain data: ${error.message}`);
    }
  };
  
  /**
 * Fetches current token prices from CoinGecko
 * @param {Array} tokens - Array of token objects with symbol property
 * @returns {Promise<Object>} Price data including ETH price and token prices
 */
export const fetchCoinGeckoData = async (tokens) => {
    try {
      console.log('Fetching real price data for tokens:', tokens.map(t => t.symbol));
      
      // Create comma-separated token list including ETH
      const tokenSymbols = ['eth', ...tokens.map(t => t.symbol.toLowerCase())].join(',');
      
      const response = await fetch(`/api/prices?tokens=${tokenSymbols}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch price data');
      }
      
      const data = await response.json();
      
      console.log('Real price data received:', {
        ethPrice: data.ethPrice,
        tokenPricesCount: Object.keys(data.tokenPrices).length
      });
      
      return {
        ethPrice: data.ethPrice,
        tokenPrices: data.tokenPrices
      };
      
    } catch (error) {
      console.error('CoinGecko API error:', error);
      
      // Graceful fallback to prevent app crashes
      console.warn('Using fallback prices due to API error');
      return {
        ethPrice: 2500, // Reasonable ETH price fallback
        tokenPrices: {
          'USDC': 1.00,
          'USDT': 1.00,
          'DAI': 1.00,
          'WBTC': 45000,
          'LINK': 15,
          'UNI': 7,
          'AAVE': 90,
          'ENS': 12
        }
      };
    }
  };
  
  /**
   * Validates if an address is properly formatted
   * @param {string} address - Ethereum address to validate
   * @returns {boolean} True if valid format
   */
  export const isValidEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };
  
  /**
   * Checks API health status
   * @returns {Promise<Object>} Status of APIs
   */
  export const checkAPIHealth = async () => {
    try {
      const healthCheck = await Promise.allSettled([
        fetch('/api/analyze?address=0x0000000000000000000000000000000000000000'),
        fetch('/api/prices?tokens=eth')
      ]);
      
      return {
        etherscan: healthCheck[0].status === 'fulfilled',
        coingecko: healthCheck[1].status === 'fulfilled',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        etherscan: false,
        coingecko: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };
  