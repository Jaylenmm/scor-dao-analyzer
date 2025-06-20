// Token price endpoint
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    const { tokens } = req.query;
    
    if (!tokens) {
      return res.status(400).json({ error: 'Tokens parameter required' });
    }
  
    try {
      // Parse tokens (comma-separated symbols)
      const tokenList = tokens.split(',').map(t => t.trim().toLowerCase());
      
      // Map common symbols to CoinGecko IDs
      const symbolToId = {
        'eth': 'ethereum',
        'usdc': 'usd-coin',
        'usdt': 'tether', 
        'dai': 'dai',
        'wbtc': 'wrapped-bitcoin',
        'link': 'chainlink',
        'uni': 'uniswap',
        'aave': 'aave',
        'ens': 'ethereum-name-service'
      };
  
      // Convert symbols to CoinGecko IDs
      const coinIds = tokenList
        .map(symbol => symbolToId[symbol])
        .filter(id => id) // Remove unknown tokens
        .join(',');
  
      if (!coinIds) {
        return res.status(400).json({ error: 'No supported tokens found' });
      }
  
      // Get current ETH price
      const ethPriceRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      
      // Get token prices  
      const tokenPricesRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
      );
  
      if (!ethPriceRes.ok || !tokenPricesRes.ok) {
        throw new Error('CoinGecko API error');
      }
  
      const ethPriceData = await ethPriceRes.json();
      const tokenPricesData = await tokenPricesRes.json();
  
      // Format response
      const prices = {
        ethPrice: ethPriceData.ethereum?.usd || 0,
        tokenPrices: {}
      };
  
      // Map back to symbols
      Object.entries(symbolToId).forEach(([symbol, id]) => {
        if (tokenPricesData[id]?.usd) {
          prices.tokenPrices[symbol.toUpperCase()] = tokenPricesData[id].usd;
        }
      });
  
      console.log('Fetched prices:', prices);
      
      res.status(200).json(prices);
  
    } catch (error) {
      console.error('Price fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch prices', 
        message: error.message 
      });
    }
  }
  
  // FILE: Updated functions for your existing App.js
  // Replace the mock functions with these real API calls
  
  const fetchEtherscanData = async (address) => {
    try {
      console.log('Fetching blockchain data for:', address);
      
      const response = await fetch(`/api/analyze?address=${address}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch blockchain data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Analysis failed');
      }
      
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
      console.error('Etherscan fetch error:', error);
      throw new Error(`Failed to fetch blockchain data: ${error.message}`);
    }
  };
  
  const fetchCoinGeckoData = async (tokens) => {
    try {
      console.log('Fetching price data for tokens:', tokens.map(t => t.symbol));
      
      // Create comma-separated token list
      const tokenSymbols = ['eth', ...tokens.map(t => t.symbol.toLowerCase())].join(',');
      
      const response = await fetch(`/api/prices?tokens=${tokenSymbols}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch price data');
      }
      
      const data = await response.json();
      
      return {
        ethPrice: data.ethPrice,
        tokenPrices: data.tokenPrices,
      };
      
    } catch (error) {
      console.error('Price fetch error:', error);
      throw new Error(`Failed to fetch price data: ${error.message}`);
    }
  };