// Main DAO analysis endpoint
export default async function handler(req, res) {
    // Enable CORS for your frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }
  
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }
  
    try {
      console.log(`Analyzing address: ${address}`);
  
      // Parallel API calls to Etherscan
      const [balanceRes, txListRes, tokenTxRes] = await Promise.all([
        // Get ETH balance
        fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY}`),
        
        // Get recent transactions
        fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`),
        
        // Get ERC-20 token transfers
        fetch(`https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`)
      ]);
  
      // Check for API errors
      if (!balanceRes.ok || !txListRes.ok || !tokenTxRes.ok) {
        throw new Error('Etherscan API error');
      }
  
      const [balanceData, txListData, tokenTxData] = await Promise.all([
        balanceRes.json(),
        txListRes.json(),
        tokenTxRes.json()
      ]);
  
      // Check Etherscan response status
      if (balanceData.status !== '1' || txListData.status !== '1') {
        throw new Error('Invalid Etherscan response');
      }
  
      // Process the data
      const ethBalance = (parseInt(balanceData.result) / 1e18).toFixed(4); // Convert Wei to ETH
      const transactions = txListData.result || [];
      const tokenTransfers = tokenTxData.result || [];
  
      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      const recentTxs = transactions.filter(tx => parseInt(tx.timeStamp) > thirtyDaysAgo).length;
  
      // Get unique tokens from transfers
      const tokenMap = new Map();
      tokenTransfers.forEach(transfer => {
        const symbol = transfer.tokenSymbol;
        const decimals = parseInt(transfer.tokenDecimal) || 18;
        const amount = parseInt(transfer.value) / Math.pow(10, decimals);
        
        if (tokenMap.has(symbol)) {
          tokenMap.set(symbol, tokenMap.get(symbol) + amount);
        } else {
          tokenMap.set(symbol, amount);
        }
      });
  
      // Convert to array format
      const tokens = Array.from(tokenMap.entries()).map(([symbol, balance]) => ({
        symbol,
        balance: balance.toFixed(2),
        contractAddress: tokenTransfers.find(t => t.tokenSymbol === symbol)?.contractAddress || ''
      }));
  
      // Get first transaction for wallet age
      const firstTx = transactions.length > 0 ? transactions[transactions.length - 1] : null;
      const firstTxTimestamp = firstTx ? new Date(parseInt(firstTx.timeStamp) * 1000).toISOString().split('T')[0] : null;
  
      const result = {
        address,
        ethBalance,
        tokens,
        txCount: transactions.length,
        recentTxs,
        firstTxTimestamp,
        lastAnalysis: new Date().toISOString(),
        success: true
      };
  
      console.log(`Analysis complete for ${address}:`, {
        ethBalance,
        tokenCount: tokens.length,
        txCount: transactions.length,
        recentTxs
      });
  
      res.status(200).json(result);
  
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze DAO', 
        message: error.message 
      });
    }
  }